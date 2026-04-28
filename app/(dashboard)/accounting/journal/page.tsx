'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Search, Download, Printer, Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  descriptionSw: string;
  debitAccount: string;
  debitAccountSw: string;
  creditAccount: string;
  creditAccountSw: string;
  amount: number;
  type: 'sale' | 'expense' | 'purchase' | 'return';
}

export default function AccountingJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { currency, t } = useAppStore();

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
            description: `Sale recorded - ${sale.saleNumber}`,
            descriptionSw: `Uuzaji uliorekodiwa - ${sale.saleNumber}`,
            debitAccount: 'Cash',
            debitAccountSw: 'Fedha',
            creditAccount: 'Sales Revenue',
            creditAccountSw: 'Mapato kutoka Mauzo',
            amount: sale.totalAmount,
            type: 'sale',
          });
          journalEntries.push({
            id: `${sale.saleNumber}-2`,
            date: sale.createdAt,
            description: `Cost of Goods Sold - ${sale.saleNumber}`,
            descriptionSw: 'Gharama ya Bidhaa Zilizouzwa',
            debitAccount: 'Cost of Goods Sold',
            debitAccountSw: 'Gharama ya Bidhaa Zilizouzwa',
            creditAccount: 'Inventory',
            creditAccountSw: 'Akiba',
            amount: sale.totalAmount * 0.6,
            type: 'sale',
          });
        });
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        expenses.forEach((expense: { id: string; description: string; amount: number; date: string; category: string }) => {
          journalEntries.push({
            id: expense.id,
            date: expense.date,
            description: `Expense - ${expense.description}`,
            descriptionSw: `Gharama - ${expense.description}`,
            debitAccount: 'Expenses',
            debitAccountSw: 'Gharama',
            creditAccount: 'Cash',
            creditAccountSw: 'Fedha',
            amount: expense.amount,
            type: 'expense',
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

  const filteredEntries = entries.filter(e => {
    const matchesSearch = !searchQuery || 
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.descriptionSw.includes(searchQuery) ||
      e.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.creditAccount.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const matchesDate = (!dateFrom || new Date(e.date) >= new Date(dateFrom)) && 
      (!dateTo || new Date(e.date) <= new Date(dateTo));
    return matchesSearch && matchesType && matchesDate;
  });

  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      [t('accounting', 'journalTitle')],
      [t('common', 'date') + ': ' + new Date().toLocaleDateString()],
      [''],
      [t('common', 'date'), t('accounting', 'description'), t('accounting', 'debitAccount'), t('accounting', 'creditAccount'), t('accounting', 'amount')],
      ...filteredEntries.map(e => [
        new Date(e.date).toLocaleDateString('en-GB'),
        e.description + ' / ' + e.descriptionSw,
        e.debitAccount + ' / ' + e.debitAccountSw,
        e.creditAccount + ' / ' + e.creditAccountSw,
        `${currencySymbol}${e.amount.toFixed(2)}`,
      ]),
      [''],
      [t('common', 'total') + ':', '', '', '', `${currencySymbol}${totalDebits.toFixed(2)}`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-slate-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('accounting', 'journalTitle')}</h1>
              <p className="text-xs text-slate-500">{t('accounting', 'journalDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('accounting', 'print')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('accounting', 'journalEntries')}</p>
            <p className="text-xl font-bold text-slate-800">{entries.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('accounting', 'debit')}</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalDebits, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('accounting', 'credit')}</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalDebits, currency)}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common', 'search')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">{t('expenses', 'allCategories')}</option>
            <option value="sale">{t('common', 'sales')}</option>
            <option value="expense">{t('common', 'expenses')}</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('accounting', 'noEntries')}</h3>
            <p className="text-slate-500">{t('accounting', 'journalDescription')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">{t('accounting', 'journalTitle')}</h2>
              <p className="text-sm text-slate-300">{t('accounting', 'journalDescription')}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">{t('common', 'date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'description')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'debitAccount')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'creditAccount')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('accounting', 'amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-800">{entry.description}</div>
                        <div className="text-xs text-slate-400">{entry.descriptionSw}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600">{entry.debitAccount}</div>
                        <div className="text-xs text-slate-400">{entry.debitAccountSw}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600">{entry.creditAccount}</div>
                        <div className="text-xs text-slate-400">{entry.creditAccountSw}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sm text-slate-800">
                        {formatCurrency(entry.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}