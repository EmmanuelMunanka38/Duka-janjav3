'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Download, PieChart } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface ConsolidatedData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  assetsBreakdown: { name: string; amount: number }[];
  liabilitiesBreakdown: { name: string; amount: number }[];
  revenueBreakdown: { name: string; amount: number }[];
}

export default function ConsolidatedPage() {
  const { currency, t } = useAppStore();
  const [data, setData] = useState<ConsolidatedData>({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    assetsBreakdown: [],
    liabilitiesBreakdown: [],
    revenueBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

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

      const [salesRes, expensesRes, productsRes] = await Promise.all([
        fetch(`/api/sales?startDate=${startDate}`),
        fetch(`/api/expenses?startDate=${startDate}`),
        fetch('/api/products'),
      ]);

      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalInventory = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        totalRevenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        totalExpenses = expensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }

      if (productsRes.ok) {
        const products = await productsRes.json();
        totalInventory = products.reduce((sum: number, p: { stock: number; price: number }) => sum + p.stock * p.price, 0);
      }

      const netIncome = totalRevenue - totalExpenses;
      const totalAssets = totalInventory + totalRevenue * 0.2;
      const totalLiabilities = totalAssets * 0.3;
      const totalEquity = totalAssets - totalLiabilities;

      setData({
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        netIncome,
        assetsBreakdown: [
          { name: 'Cash', amount: totalRevenue * 0.2 },
          { name: 'Inventory', amount: totalInventory },
          { name: 'Accounts Receivable', amount: totalRevenue * 0.1 },
        ],
        liabilitiesBreakdown: [
          { name: 'Accounts Payable', amount: totalLiabilities * 0.6 },
          { name: 'Loans', amount: totalLiabilities * 0.4 },
        ],
        revenueBreakdown: [
          { name: 'Sales', amount: totalRevenue },
          { name: 'Services', amount: totalRevenue * 0.1 },
        ],
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : 'TSh';
    const csvContent = [
      ['CONSOLIDATED REPORT', `Period: ${period}`],
      [''],
      ['ASSETS'],
      ...data.assetsBreakdown.map(a => [a.name, `${currencySymbol}${a.amount.toFixed(2)}`]),
      ['Total Assets', `${currencySymbol}${data.totalAssets.toFixed(2)}`],
      [''],
      ['LIABILITIES'],
      ...data.liabilitiesBreakdown.map(l => [l.name, `${currencySymbol}${l.amount.toFixed(2)}`]),
      ['Total Liabilities', `${currencySymbol}${data.totalLiabilities.toFixed(2)}`],
      [''],
      ['EQUITY'],
      ['Net Income', `${currencySymbol}${data.netIncome.toFixed(2)}`],
      ['Total Equity', `${currencySymbol}${data.totalEquity.toFixed(2)}`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidated-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PieChart className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('common', 'consolidated')}</h1>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('common', 'cashFlow')} Beginning</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalAssets, currency)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('reports', 'netProfit')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(data.netIncome, currency)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('common', 'total')}</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totalEquity, currency)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-purple-600 text-white">
                <h2 className="text-lg font-bold">{t('common', 'consolidated')} {t('reports', 'title')}</h2>
                <p className="text-sm text-purple-200">
                  {period === 'month' ? t('dashboard', 'monthSales') : period === 'quarter' ? t('reports', 'quarter') : t('reports', 'year')}
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Assets</h3>
                    {data.assetsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="font-medium text-blue-600">{formatCurrency(item.amount, currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-lg mt-2">
                      <span className="font-bold text-slate-800">{t('reports', 'totalProducts')}</span>
                      <span className="font-bold text-blue-600">{formatCurrency(data.totalAssets, currency)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Liabilities</h3>
                    {data.liabilitiesBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="font-medium text-red-600">{formatCurrency(item.amount, currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                      <span className="font-bold text-slate-800">{t('reports', 'totalExpenses')}</span>
                      <span className="font-bold text-red-600">{formatCurrency(data.totalLiabilities, currency)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Equity</h3>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-700">{t('reports', 'netProfit')}</span>
                      <span className="font-medium text-green-600">{formatCurrency(data.netIncome, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-700">{t('reports', 'netProfit')}</span>
                      <span className="font-medium text-slate-600">{formatCurrency(data.totalRevenue, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-purple-50 px-3 rounded-lg mt-2">
                      <span className="font-bold text-slate-800">{t('common', 'total')}</span>
                      <span className="font-bold text-purple-600">{formatCurrency(data.totalEquity, currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}