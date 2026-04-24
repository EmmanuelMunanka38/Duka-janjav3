'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export default function AccountingJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { currency } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, expensesRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
      ]);

      const journalEntries: JournalEntry[] = [];

      if (salesRes.ok) {
        const sales = await salesRes.json();
        sales.forEach((sale: { saleNumber: string; totalAmount: number; createdAt: string; paymentMethod: string }) => {
          journalEntries.push({
            id: `${sale.saleNumber}-1`,
            date: sale.createdAt,
            description: `Sale - ${sale.saleNumber}`,
            debitAccount: 'Cash',
            creditAccount: 'Sales Revenue',
            amount: sale.totalAmount,
          });
          journalEntries.push({
            id: `${sale.saleNumber}-2`,
            date: sale.createdAt,
            description: `Cost of Goods Sold - ${sale.saleNumber}`,
            debitAccount: 'Cost of Goods Sold',
            creditAccount: 'Inventory',
            amount: sale.totalAmount * 0.6,
          });
        });
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        expenses.forEach((expense: { id: string; description: string; amount: number; date: string }) => {
          journalEntries.push({
            id: expense.id,
            date: expense.date,
            description: expense.description,
            debitAccount: 'Rent Expense',
            creditAccount: 'Cash',
            amount: expense.amount,
          });
        });
      }

      setEntries(journalEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.creditAccount.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-slate-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">General Journal</h1>
              <p className="text-xs text-slate-500">View all accounting transactions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Entries</p>
            <p className="text-xl font-bold text-slate-800">{entries.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Debits</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalDebits, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Credits</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalDebits, currency)}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No journal entries</h3>
            <p className="text-slate-500">Journal entries will appear after transactions</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{entry.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{entry.debitAccount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{entry.creditAccount}</td>
                    <td className="px-4 py-3 text-right font-medium text-sm text-slate-800">
                      {formatCurrency(entry.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}