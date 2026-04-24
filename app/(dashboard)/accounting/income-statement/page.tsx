'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Download } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface IncomeStatementData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: { name: string; amount: number }[];
  totalExpenses: number;
  netIncome: number;
}

export default function IncomeStatementPage() {
  const [data, setData] = useState<IncomeStatementData>({
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: [],
    totalExpenses: 0,
    netIncome: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const { currency, t } = useAppStore();

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = '';

      if (period === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        startDate = monthAgo.toISOString().split('T')[0];
      } else if (period === 'quarter') {
        const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
        startDate = quarterAgo.toISOString().split('T')[0];
      } else {
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        startDate = yearAgo.toISOString().split('T')[0];
      }

      const [salesRes, expensesRes] = await Promise.all([
        fetch(`/api/sales?startDate=${startDate}`),
        fetch(`/api/expenses?startDate=${startDate}`),
      ]);

      let revenue = 0;
      let cogs = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        cogs = revenue * 0.6;
      }

      let expenses: { name: string; amount: number }[] = [];
      let totalExpenses = 0;

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        const expenseByCategory: Record<string, number> = {};
        expensesData.forEach((e: { category: string; amount: number }) => {
          expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        });
        expenses = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }));
        totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      }

      setData({
        revenue,
        cogs,
        grossProfit: revenue - cogs,
        expenses,
        totalExpenses,
        netIncome: revenue - cogs - totalExpenses,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'KES' ? 'KSh' : currency === 'TZS' ? 'TSh' : currency === 'UGX' ? 'USh' : currency;
    const csvContent = [
      ['INCOME STATEMENT', `Period: ${period}`],
      [''],
      ['Revenue', `${currencySymbol}${data.revenue.toFixed(2)}`],
      ['Cost of Goods Sold', `${currencySymbol}${data.cogs.toFixed(2)}`],
      ['Gross Profit', `${currencySymbol}${data.grossProfit.toFixed(2)}`],
      [''],
      ['Operating Expenses'],
      ...data.expenses.map(e => [e.name, `${currencySymbol}${e.amount.toFixed(2)}`]),
      ['Total Expenses', `${currencySymbol}${data.totalExpenses.toFixed(2)}`],
      [''],
      ['Net Income', `${currencySymbol}${data.netIncome.toFixed(2)}`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('common', 'incomeStatement')}</h1>
              <p className="text-xs text-slate-500">{t('reports', 'title')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="month">{t('dashboard', 'monthSales')}</option>
              <option value="quarter">{t('reports', 'quarter')}</option>
              <option value="year">{t('reports', 'year')}</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">{t('common', 'incomeStatement')}</h2>
              <p className="text-sm text-slate-300">
                {period === 'month' ? t('dashboard', 'monthSales') : period === 'quarter' ? t('reports', 'quarter') : t('reports', 'year')}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('reports', 'netProfit')}</h3>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">{t('reports', 'totalSales')}</span>
                  <span className="font-medium text-green-600">{formatCurrency(data.revenue, currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">Cost of Goods Sold</span>
                  <span className="font-medium text-red-600">-{formatCurrency(data.cogs, currency)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-slate-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('reports', 'netProfit')}</span>
                  <span className={`font-bold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.grossProfit, currency)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('expenses', 'title')}</h3>
                {data.expenses.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">{t('reports', 'noExpenses')}</p>
                ) : (
                  data.expenses.map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-700">{expense.name}</span>
                      <span className="font-medium text-red-600">-{formatCurrency(expense.amount, currency)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-3 bg-slate-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('expenses', 'totalExpenses')}</span>
                  <span className="font-bold text-red-600">-{formatCurrency(data.totalExpenses, currency)}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4">
                <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-lg">
                  <span className="text-lg font-bold text-slate-800">Net Income</span>
                  <span className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netIncome, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}