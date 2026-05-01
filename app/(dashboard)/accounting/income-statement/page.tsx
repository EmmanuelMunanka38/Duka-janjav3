'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Download, Printer, FileSpreadsheet, ChevronDown, Building2 } from 'lucide-react';
import { useAppStore, Branch } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ExpenseData {
  name: string;
  amount: number;
}

interface IncomeStatementData {
  revenue: number;
  previousRevenue: number;
  cogs: number;
  previousCogs: number;
  grossProfit: number;
  expenses: ExpenseData[];
  totalExpenses: number;
  previousTotalExpenses: number;
  netIncome: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export default function IncomeStatementPage() {
  const { currency, t, currentBranch, branches } = useAppStore();
  const [data, setData] = useState<IncomeStatementData>({
    revenue: 0,
    previousRevenue: 0,
    cogs: 0,
    previousCogs: 0,
    grossProfit: 0,
    expenses: [],
    totalExpenses: 0,
    previousTotalExpenses: 0,
    netIncome: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'thisMonth' | 'lastMonth' | 'quarter' | 'year'>('thisMonth');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [chartData, setChartData] = useState<{ name: string; revenue: number; expenses: number; profit: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [period, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startDate = '';
      let previousStartDate = '';
      const now = new Date();

      switch (period) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
          previousStartDate = new Date(now.getFullYear() - 2, now.getMonth(), 1).toISOString().split('T')[0];
          break;
      }

      const branchId = branchFilter !== 'all' ? branchFilter : undefined;
      const salesParams = new URLSearchParams({ startDate });
      if (branchId) salesParams.append('branchId', branchId);
      const prevSalesParams = new URLSearchParams({ startDate: previousStartDate });
      if (branchId) prevSalesParams.append('branchId', branchId);

      const [salesRes, prevSalesRes, expensesRes, prevExpensesRes] = await Promise.all([
        fetch(`/api/sales?${salesParams.toString()}`),
        fetch(`/api/sales?${prevSalesParams.toString()}`),
        fetch(`/api/expenses?startDate=${startDate}${branchId ? `&branchId=${branchId}` : ''}`),
        fetch(`/api/expenses?startDate=${previousStartDate}${branchId ? `&branchId=${branchId}` : ''}`),
      ]);

      let revenue = 0;
      let previousRevenue = 0;
      let cogs = 0;
      let previousCogs = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        cogs = revenue * 0.6;
      }
      if (prevSalesRes.ok) {
        const prevSales = await prevSalesRes.json();
        previousRevenue = prevSales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        previousCogs = previousRevenue * 0.6;
      }

      let expenses: ExpenseData[] = [];
      let totalExpenses = 0;
      let previousTotalExpenses = 0;

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        const expenseByCategory: Record<string, number> = {};
        expensesData.forEach((e: { category: string; amount: number }) => {
          expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        });
        expenses = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }));
        totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      }
      if (prevExpensesRes.ok) {
        const prevExpensesData = await prevExpensesRes.json();
        previousTotalExpenses = prevExpensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }

      const grossProfit = revenue - cogs;
      const netIncome = revenue - cogs - totalExpenses;

      setData({
        revenue,
        previousRevenue,
        cogs,
        previousCogs,
        grossProfit,
        expenses,
        totalExpenses,
        previousTotalExpenses,
        netIncome,
      });

      const monthlyData = [
        { name: t('dashboard', 'weekSales') || 'Week 1', revenue: revenue * 0.3, expenses: totalExpenses * 0.25, profit: revenue * 0.3 - totalExpenses * 0.25 },
        { name: t('dashboard', 'weekSales') || 'Week 2', revenue: revenue * 0.35, expenses: totalExpenses * 0.3, profit: revenue * 0.35 - totalExpenses * 0.3 },
        { name: t('dashboard', 'weekSales') || 'Week 3', revenue: revenue * 0.2, expenses: totalExpenses * 0.25, profit: revenue * 0.2 - totalExpenses * 0.25 },
        { name: t('reports', 'month') || 'Week 4', revenue: revenue * 0.15, expenses: totalExpenses * 0.2, profit: revenue * 0.15 - totalExpenses * 0.2 },
      ];
      setChartData(monthlyData);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = getChange(data.revenue, data.previousRevenue);
  const expensesChange = getChange(data.totalExpenses, data.previousTotalExpenses);
  const profitChange = getChange(data.netIncome, data.revenue - data.previousRevenue - data.previousTotalExpenses);

  const handleExport = (type: 'csv' | 'excel') => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      [t('accounting', 'incomeStatement')],
      [t('common', 'date') + ': ' + new Date().toLocaleDateString()],
      [''],
      [t('accounting', 'totalRevenue') + ' (' + t('accounting', 'totalRevenueLong') + ')', `${currencySymbol}${data.revenue.toFixed(2)}`],
      [t('accounting', 'costOfGoodsSold') + ' (' + t('accounting', 'costOfGoodsSoldLong') + ')', `-${currencySymbol}${data.cogs.toFixed(2)}`],
      [t('accounting', 'grossProfit') + ' (' + t('accounting', 'grossProfitLong') + ')', `${currencySymbol}${data.grossProfit.toFixed(2)}`],
      [''],
      [t('accounting', 'operatingExpenses')],
      ...data.expenses.map(e => [e.name, `-${currencySymbol}${e.amount.toFixed(2)}`]),
      [t('accounting', 'totalExpenses2'), `-${currencySymbol}${data.totalExpenses.toFixed(2)}`],
      [''],
      [t('accounting', 'netProfit') + ' (' + t('accounting', 'netProfitLong') + ')', `${currencySymbol}${data.netIncome.toFixed(2)}`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const expensePieData = data.expenses.map(e => ({
    name: e.name,
    value: e.amount,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('accounting', 'incomeStatement')}</h1>
              <p className="text-xs text-slate-500">{t('accounting', 'incomeStatementDescription')}</p>
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
              <option value="year">{t('accounting', 'year')}</option>
            </select>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">{t('accounting', 'totalRevenue')}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(revenueChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(data.revenue, currency)}</p>
                <p className="text-xs text-slate-400 mt-1">{t('accounting', 'totalRevenueLong')}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">{t('accounting', 'operatingExpenses')}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${expensesChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {expensesChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(expensesChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalExpenses, currency)}</p>
                <p className="text-xs text-slate-400 mt-1">{t('accounting', 'operatingExpensesLong')}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">{t('accounting', 'grossProfit')}</span>
                </div>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(data.grossProfit, currency)}</p>
                <p className="text-xs text-slate-400 mt-1">{t('accounting', 'grossProfitLong')}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">{t('accounting', 'netProfit')}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(profitChange).toFixed(1)}%
                  </span>
                </div>
                <p className={`text-xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netIncome, currency)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{t('accounting', 'netProfitLong')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t('accounting', 'totalRevenue2')} vs {t('accounting', 'operatingExpenses')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value, currency)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
                    <Legend />
                    <Bar dataKey="revenue" name={t('common', 'revenue')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name={t('accounting', 'operatingExpenses')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name={t('common', 'profit')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t('accounting', 'operatingExpenses')} Breakdown</h3>
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    {t('reports', 'noExpenses')}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 text-white">
                <h2 className="text-lg font-bold">{t('accounting', 'incomeStatement')}</h2>
                <p className="text-sm text-slate-300">{t('accounting', 'incomeStatementDescription')}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('accounting', 'description')}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('common', 'name')}</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('accounting', 'amount')}</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('accounting', 'percentageOfRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-600">{t('accounting', 'totalRevenueLong')}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{t('common', 'revenue')}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-green-600">{formatCurrency(data.revenue, currency)}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-500">100%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-600">{t('accounting', 'costOfGoodsSoldLong')}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{t('common', 'costOfGoodsSold')}</td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-red-600">-{formatCurrency(data.cogs, currency)}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-500">{data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="bg-blue-50 hover:bg-blue-100">
                      <td className="px-6 py-3 text-sm font-bold text-slate-700">{t('accounting', 'grossProfitLong')}</td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-500">{t('common', 'grossProfit')}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-blue-600">{formatCurrency(data.grossProfit, currency)}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-500">{data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    {data.expenses.map((expense, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-600">{expense.name}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{expense.name}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-red-600">-{formatCurrency(expense.amount, currency)}</td>
                        <td className="px-6 py-3 text-right text-sm text-slate-500">{data.revenue > 0 ? ((expense.amount / data.revenue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-bold text-slate-700">{t('accounting', 'operatingExpensesLong')}</td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-500">{t('accounting', 'operatingExpenses')}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-red-600">-{formatCurrency(data.totalExpenses, currency)}</td>
                      <td className="px-6 py-3 text-right text-sm text-slate-500">{data.revenue > 0 ? ((data.totalExpenses / data.revenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                    <tr className="bg-green-50 hover:bg-green-100 border-t-2 border-slate-200">
                      <td className="px-6 py-4 text-lg font-bold text-slate-800">{t('accounting', 'netProfitLong')}</td>
                      <td className="px-6 py-4 text-lg font-bold text-slate-500">{t('common', 'netProfit')}</td>
                      <td className={`px-6 py-4 text-right text-lg font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.netIncome, currency)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">{data.revenue > 0 ? ((data.netIncome / data.revenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}