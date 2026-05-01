'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Download, Printer, Building2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';

interface PLData {
  salesRevenue: number;
  otherIncome: number;
  totalRevenue: number;
  openingStock: number;
  purchases: number;
  closingStockValue: number;
  cogs: number;
  grossProfit: number;
  expenses: { category: string; categorySw: string; amount: number }[];
  totalExpenses: number;
  netProfit: number;
}

interface LastPeriodPL {
  salesRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
}

export default function ProfitLossPage() {
  const { currency, t, branches, currentBranch } = useAppStore();
  const [data, setData] = useState<PLData>({
    salesRevenue: 0,
    otherIncome: 0,
    totalRevenue: 0,
    openingStock: 0,
    purchases: 0,
    closingStockValue: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: [],
    totalExpenses: 0,
    netProfit: 0,
  });
  const [lastPeriod, setLastPeriod] = useState<LastPeriodPL>({
    salesRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth'>('thisMonth');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [period, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = '';
      let previousStartDate = '';

      if (period === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      }

      const branchId = branchFilter !== 'all' ? branchFilter : undefined;
      const params = startDate ? `?startDate=${startDate}` : '';
      const prevParams = previousStartDate ? `?startDate=${previousStartDate}` : '';
      const branchParams = branchId ? `${params ? '&' : '?'}branchId=${branchId}` : '';
      const prevBranchParams = branchId ? `${prevParams ? '&' : '?'}branchId=${branchId}` : '';

      const [salesRes, expensesRes, productsRes, prevSalesRes, prevExpensesRes] = await Promise.all([
        fetch(`/api/sales${params}${branchParams}`),
        fetch(`/api/expenses${params}${branchParams}`),
        fetch(`/api/products${branchParams ? branchParams.replace('?', '') : ''}`),
        fetch(`/api/sales${prevParams}${prevBranchParams}`),
        fetch(`/api/expenses${prevParams}${prevBranchParams}`),
      ]);

      let salesRevenue = 0;
      let purchases = 0;
      let closingStockValue = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        salesRevenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        purchases = salesRevenue * 0.5;
      }

      if (productsRes.ok) {
        const products = await productsRes.json();
        closingStockValue = products.reduce((sum: number, p: { stock: number; cost: number }) => sum + p.stock * p.cost, 0);
      }

      let expenses: { category: string; categorySw: string; amount: number }[] = [];
      let totalExpenses = 0;

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        const expenseByCategory: Record<string, number> = {};
        expensesData.forEach((e: { category: string; amount: number }) => {
          expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        });
        expenses = Object.entries(expenseByCategory).map(([category, amount]) => ({
          category,
          categorySw: getSwahiliCategory(category),
          amount,
        }));
        totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      }

      const openingStock = closingStockValue * 0.8;
      const cogs = openingStock + purchases - closingStockValue;
      const grossProfit = salesRevenue - cogs;
      const netProfit = grossProfit - totalExpenses;

      setData({
        salesRevenue,
        otherIncome: 0,
        totalRevenue: salesRevenue,
        openingStock,
        purchases,
        closingStockValue,
        cogs,
        grossProfit,
        expenses,
        totalExpenses,
        netProfit,
      });

      let prevSalesRevenue = 0;
      let prevTotalExpenses = 0;
      if (prevSalesRes.ok) {
        const prevSales = await prevSalesRes.json();
        prevSalesRevenue = prevSales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
      }
      if (prevExpensesRes.ok) {
        const prevExpensesData = await prevExpensesRes.json();
        prevTotalExpenses = prevExpensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }
      const prevCogs = prevSalesRevenue * 0.6;
      setLastPeriod({
        salesRevenue: prevSalesRevenue,
        totalExpenses: prevTotalExpenses,
        grossProfit: prevSalesRevenue - prevCogs,
        netProfit: prevSalesRevenue - prevCogs - prevTotalExpenses,
      });

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSwahiliCategory = (category: string): string => {
    const swahiliCategories: Record<string, string> = {
      'Supplies': 'Vifaa',
      'Utilities': 'Huduma za Umeme',
      'Rent': 'Kodi ya Nyumba',
      'Transport': 'Usafiri',
      'Software': 'Programu',
      'Repairs': 'Marejare',
      'Marketing': 'Masoko',
      'Salaries': 'Mishahara',
      'Insurance': 'Bima',
    };
    return swahiliCategories[category] || category;
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      [t('accounting', 'profitLoss')],
      [t('common', 'date') + ': ' + new Date().toLocaleDateString()],
      [''],
      [t('accounting', 'salesRevenueLong')],
      [t('accounting', 'salesRevenue'), `${currencySymbol}${data.salesRevenue.toFixed(2)}`],
      [t('accounting', 'otherIncomeLong')],
      [t('accounting', 'otherIncome'), `${currencySymbol}${data.otherIncome.toFixed(2)}`],
      [t('accounting', 'totalRevenue2'), `${currencySymbol}${data.totalRevenue.toFixed(2)}`],
      [''],
      ['Opening Stock', `${currencySymbol}${data.openingStock.toFixed(2)}`],
      ['Purchases', `${currencySymbol}${data.purchases.toFixed(2)}`],
      ['Less: Closing Stock', `-${currencySymbol}${data.closingStockValue.toFixed(2)}`],
      [t('accounting', 'costOfGoodsSoldLong')],
      [t('accounting', 'costOfGoodsSold'), `-${currencySymbol}${data.cogs.toFixed(2)}`],
      [''],
      [t('accounting', 'grossProfitLong')],
      [t('accounting', 'grossProfit'), `${currencySymbol}${data.grossProfit.toFixed(2)}`],
      [''],
      ...data.expenses.map(e => [e.categorySw + ' (' + e.category + ')', `-${currencySymbol}${e.amount.toFixed(2)}`]),
      [t('accounting', 'operatingExpensesLong')],
      [t('accounting', 'operatingExpenses'), `-${currencySymbol}${data.totalExpenses.toFixed(2)}`],
      [''],
      [t('accounting', 'netProfitLong')],
      [t('accounting', 'netProfit'), `${currencySymbol}${data.netProfit.toFixed(2)}`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('accounting', 'profitLoss')}</h1>
              <p className="text-xs text-slate-500">{t('accounting', 'profitLossDescription')}</p>
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
            </select>
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">{t('accounting', 'profitLoss')}</h2>
              <p className="text-sm text-slate-300">{period === 'thisMonth' ? t('accounting', 'thisMonth') : t('accounting', 'lastMonth')}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'description')}</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('accounting', 'thisPeriod')}</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('accounting', 'lastPeriod')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-green-50">
                    <td colSpan={3} className="px-6 py-3 font-bold text-green-700">{t('accounting', 'salesRevenueLong')}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 pl-10 text-slate-700">
                      {t('accounting', 'salesRevenue')}
                      <span className="text-xs text-slate-400 block">{t('accounting', 'salesRevenueLong')}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(data.salesRevenue, currency)}</td>
                    <td className="px-6 py-3 text-right text-slate-400">{formatCurrency(lastPeriod.salesRevenue, currency)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 pl-10 text-slate-700">
                      {t('accounting', 'otherIncome')}
                      <span className="text-xs text-slate-400 block">{t('accounting', 'otherIncomeLong')}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(data.otherIncome, currency)}</td>
                    <td className="px-6 py-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="bg-green-100 font-bold">
                    <td className="px-6 py-3 text-green-800">{t('accounting', 'totalRevenue2')}</td>
                    <td className="px-6 py-3 text-right text-green-700">{formatCurrency(data.totalRevenue, currency)}</td>
                    <td className="px-6 py-3 text-right text-green-600">{formatCurrency(lastPeriod.salesRevenue, currency)}</td>
                  </tr>

                  <tr className="bg-blue-50">
                    <td colSpan={3} className="px-6 py-3 font-bold text-blue-700">{t('accounting', 'costOfGoodsSoldDescription') || 'COST OF GOODS SOLD'}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 pl-10 text-slate-700">
                      {t('accounting', 'openingStock')}
                      <span className="text-xs text-slate-400 block">{t('accounting', 'openingStockLong')}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(data.openingStock, currency)}</td>
                    <td className="px-6 py-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 pl-10 text-slate-700">
                      {t('accounting', 'purchases')}
                      <span className="text-xs text-slate-400 block">{t('accounting', 'purchasesLong')}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(data.purchases, currency)}</td>
                    <td className="px-6 py-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 pl-10 text-slate-700">
                      {'Less: ' + t('accounting', 'closingStock')}
                      <span className="text-xs text-slate-400 block">{t('accounting', 'closingStockLong')}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-green-600">-{formatCurrency(data.closingStockValue, currency)}</td>
                    <td className="px-6 py-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="bg-blue-100 font-bold">
                    <td className="px-6 py-3 text-blue-800">{t('accounting', 'costOfGoodsSold')}</td>
                    <td className="px-6 py-3 text-right text-blue-700">-{formatCurrency(data.cogs, currency)}</td>
                    <td className="px-6 py-3 text-right text-blue-600">-</td>
                  </tr>

                  <tr className="bg-green-200 font-bold">
                    <td className="px-6 py-4 text-green-800">{t('accounting', 'grossProfit')}</td>
                    <td className={`px-6 py-4 text-right text-lg font-bold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.grossProfit, currency)}
                    </td>
                    <td className={`px-6 py-4 text-right ${lastPeriod.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lastPeriod.grossProfit, currency)}
                    </td>
                  </tr>

                  <tr className="bg-red-50">
                    <td colSpan={3} className="px-6 py-3 font-bold text-red-700">{t('accounting', 'operatingExpenses')}</td>
                  </tr>
                  {data.expenses.map((expense, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-3 pl-10 text-slate-700">
                        {expense.categorySw}
                        <span className="text-xs text-slate-400 block">{expense.category}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-red-600">-{formatCurrency(expense.amount, currency)}</td>
                      <td className="px-6 py-3 text-right text-slate-400">-</td>
                    </tr>
                  ))}
                  <tr className="bg-red-100 font-bold">
                    <td className="px-6 py-3 text-red-800">{t('accounting', 'operatingExpenses')}</td>
                    <td className="px-6 py-3 text-right text-red-700">-{formatCurrency(data.totalExpenses, currency)}</td>
                    <td className="px-6 py-3 text-right text-red-600">-{formatCurrency(lastPeriod.totalExpenses, currency)}</td>
                  </tr>

                  <tr className={`${data.netProfit >= 0 ? 'bg-green-200' : 'bg-red-200'} font-bold`}>
                    <td className="px-6 py-4 text-lg">
                      {t('accounting', 'profitLoss')}
                      <span className="text-xs block opacity-75">{t('accounting', 'profitLossLong')}</span>
                    </td>
                    <td className={`px-6 py-4 text-right text-xl font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(data.netProfit, currency)}
                    </td>
                    <td className={`px-6 py-4 text-right text-lg ${lastPeriod.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(lastPeriod.netProfit, currency)}
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