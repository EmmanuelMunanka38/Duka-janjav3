'use client';

import { useEffect, useState } from 'react';
import { Download, Printer, FileSpreadsheet, ChevronDown, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppStore, Branch } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';

interface CashEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: 'sale' | 'expense' | 'purchase' | 'return' | 'manual';
  amount: number;
  isIn: boolean;
}

export default function CashBookPage() {
  const { currency, t, currentBranch, branches } = useAppStore();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth' | 'quarter'>('thisMonth');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [newEntry, setNewEntry] = useState({ description: '', amount: '', isIn: true });

  useEffect(() => {
    fetchData();
  }, [period, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startDate = '';
      const now = new Date();

      switch (period) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
          break;
      }

      const branchId = branchFilter !== 'all' ? branchFilter : undefined;
      const salesParams = new URLSearchParams({ startDate });
      if (branchId) salesParams.append('branchId', branchId);

      const [salesRes, expensesRes] = await Promise.all([
        fetch(`/api/sales?${salesParams.toString()}`),
        fetch(`/api/expenses?startDate=${startDate}${branchId ? `&branchId=${branchId}` : ''}`),
      ]);

      const cashEntries: CashEntry[] = [];

      if (salesRes.ok) {
        const sales = await salesRes.json();
        sales.forEach((sale: { id: string; saleNumber: string; createdAt: string; totalAmount: number; paymentMethod: string }) => {
          cashEntries.push({
            id: sale.id,
            date: sale.createdAt,
            description: `Sale - ${sale.saleNumber} (${sale.paymentMethod})`,
            reference: sale.saleNumber,
            type: 'sale',
            amount: sale.totalAmount,
            isIn: true,
          });
        });
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        expenses.forEach((expense: { id: string; description: string; date: string; amount: number; category: string }) => {
          cashEntries.push({
            id: expense.id,
            date: expense.date,
            description: `Expense - ${expense.category}: ${expense.description}`,
            reference: `EXP-${expense.id.slice(0, 6)}`,
            type: 'expense',
            amount: expense.amount,
            isIn: false,
          });
        });
      }

      const sortedEntries = cashEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEntries(sortedEntries);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRunningBalance = () => {
    let balance = openingBalance;
    return entries.map(entry => {
      balance += entry.isIn ? entry.amount : -entry.amount;
      return { ...entry, runningBalance: balance };
    });
  };

  const processedEntries = calculateRunningBalance();
  const totalIn = processedEntries.filter(e => e.isIn).reduce((sum, e) => sum + e.amount, 0);
  const totalOut = processedEntries.filter(e => !e.isIn).reduce((sum, e) => sum + e.amount, 0);
  const closingBalance = openingBalance + totalIn - totalOut;

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      [t('accounting', 'cashbookTitle')],
      [t('common', 'date') + ': ' + new Date().toLocaleDateString()],
      [''],
      [t('accounting', 'openingBalance'), `${currencySymbol}${openingBalance.toFixed(2)}`],
      [''],
      [t('common', 'date'), t('accounting', 'description'), t('accounting', 'reference'), t('accounting', 'pesani'), t('accounting', 'pesanje'), t('accounting', 'salio')],
      ...processedEntries.map(e => [
        new Date(e.date).toLocaleDateString('en-GB'),
        e.description,
        e.reference,
        e.isIn ? `${currencySymbol}${e.amount.toFixed(2)}` : '',
        !e.isIn ? `${currencySymbol}${e.amount.toFixed(2)}` : '',
        `${currencySymbol}${e.runningBalance.toFixed(2)}`,
      ]),
      [''],
      [t('accounting', 'totalRevenue2'), '', '', `${currencySymbol}${totalIn.toFixed(2)}`, '', ''],
      [t('accounting', 'totalExpenses2'), '', '', '', `${currencySymbol}${totalOut.toFixed(2)}`, ''],
      [t('accounting', 'closingBalance'), '', '', '', '', `${currencySymbol}${closingBalance.toFixed(2)}`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashbook-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('accounting', 'cashBook')}</h1>
              <p className="text-xs text-slate-500">{t('accounting', 'cashbookDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">{t('branches', 'allBranches')}</option>
              {branches.filter(b => b.status === 'active').map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="thisMonth">{t('accounting', 'thisMonth')}</option>
              <option value="lastMonth">{t('accounting', 'lastMonth')}</option>
              <option value="quarter">{t('accounting', 'quarter')}</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('accounting', 'print')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <label className="block text-sm text-slate-500 mb-2">{t('accounting', 'openingBalance')}</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{t('accounting', 'cashIn')}</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIn, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{t('accounting', 'cashOut')}</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalOut, currency)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">{t('accounting', 'cashbookTitle')}</h2>
              <p className="text-sm text-slate-300">{t('accounting', 'cashbookDescription')}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">{t('common', 'date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'description')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">{t('accounting', 'reference')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-green-600 uppercase">{t('accounting', 'pesani')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-red-600 uppercase">{t('accounting', 'pesanje')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase">{t('accounting', 'salio')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        {t('accounting', 'noEntries')}
                      </td>
                    </tr>
                  ) : (
                    processedEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(entry.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{entry.reference}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                          {entry.isIn ? formatCurrency(entry.amount, currency) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                          {!entry.isIn ? formatCurrency(entry.amount, currency) : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${entry.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(entry.runningBalance, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-right">{t('accounting', 'closingBalance')}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totalIn, currency)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totalOut, currency)}</td>
                    <td className={`px-4 py-3 text-right ${closingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(closingBalance, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}