'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, Calendar, Filter, Printer, 
  TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
  AlertTriangle, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  discount: number;
  taxAmount: number;
  paymentMethod: string;
  customerName: string | null;
  branchId: string | null;
  createdAt: string;
  items: { quantity: number; productName: string; unitPrice: number; totalPrice: number }[];
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  cost: number;
  lowStockThreshold: number;
  category: string | null;
}

interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
}

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#4f46e5', '#0d9488'];

const LABELS = {
  en: {
    sales: 'Sales',
    expenses: 'Expenses',
    inventory: 'Inventory',
    profitLoss: 'Profit & Loss',
    cashFlow: 'Cash Flow',
    custom: 'Custom',
    dateRange: 'Date Range',
    format: 'Format',
    generate: 'Generate Report',
    totalSales: 'Total Sales',
    totalRevenue: 'Total Revenue',
    avgTransaction: 'Avg Transaction',
    topProduct: 'Top Product',
    topPayment: 'Top Payment',
    dailyRevenue: 'Daily Revenue',
    byPayment: 'By Payment Method',
    revenueTrend: 'Revenue Trend',
    topProducts: 'Top Products',
    monthlyExpense: 'Monthly Expenses',
    byCategory: 'By Category',
    totalProducts: 'Total Products',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    inventoryValue: 'Inventory Value',
    stockByCategory: 'Stock by Category',
    previousPeriod: 'Previous Period',
    thisPeriod: 'This Period',
  },
  sw: {
    sales: 'Mauzo',
    expenses: 'Matumizi',
    inventory: 'Hisa',
    profitLoss: 'Faida & Hasara',
    cashFlow: 'Mtiririko wa Pesa',
    custom: 'Maalum',
    dateRange: 'Tarehe',
    format: 'Umbo',
    generate: 'Tengeneza Ripoti',
    totalSales: 'Jumla Mauzo',
    totalRevenue: 'Jumla Mapato',
    avgTransaction: 'Kiwango Cha Mauzo',
    topProduct: 'Bidhaa Ya Juu',
    topPayment: 'Malipo Ya Juu',
    dailyRevenue: 'Mapato Kila Siku',
    byPayment: 'Kwa Njia Ya Malipo',
    revenueTrend: 'Mtiririko Wa Mapato',
    topProducts: 'Bidhaa 10 Za Juu',
    monthlyExpense: 'Matutumizi Kila Mwezi',
    byCategory: 'Kwa Category',
    totalProducts: 'Jumla Bidhaa',
    lowStock: 'Hisa Chache',
    outOfStock: 'Haija',
    inventoryValue: 'Thamani Ya Hisa',
    stockByCategory: 'Hisa Kwa Category',
    previousPeriod: 'Kipindi Mwengine',
    thisPeriod: 'Kipindi Hiki',
  },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-slate-600">
            {entry.name}: {formatCurrency(entry.value, 'TZS')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string; percent?: number }[] }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, p) => sum + p.value, 0);
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        {payload.map((entry, index) => (
          <p key={index} className="text-slate-600">
            {entry.name}: {formatCurrency(entry.value, 'TZS')} ({((entry.value / total) * 100).toFixed(1)}%)
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { currency, branches, currentBranch, language } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'inventory' | 'profitLoss' | 'cashFlow' | 'custom'>('sales');
  const [branchFilter, setBranchFilter] = useState('all');
const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [datePreset, setDatePreset] = useState('');
  
  const labels = LABELS[language as keyof typeof LABELS] || LABELS.en;

  const setDatePresetFn = (preset: string) => {
    const today = new Date();
    setDatePreset(preset);
    switch (preset) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        setDateFrom(monthAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        setDateFrom(yearAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportType, branchFilter, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);

      const [salesRes, expensesRes, productsRes, settingsRes]: [Response, Response, Response, Response] = await Promise.all([
        reportType === 'sales' || reportType === 'profitLoss' || reportType === 'cashFlow' ? fetch(`/api/sales?${params.toString()}`) : Promise.resolve({ ok: false } as Response),
        reportType === 'expenses' || reportType === 'profitLoss' || reportType === 'cashFlow' ? fetch(`/api/expenses?${params.toString()}`) : Promise.resolve({ ok: false } as Response),
        reportType === 'inventory' || reportType === 'profitLoss' ? fetch('/api/products') : Promise.resolve({ ok: false } as Response),
        fetch('/api/settings'),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (settingsRes.ok) setBusinessSettings(await settingsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    const saleDate = s.createdAt;
    if (dateFrom && new Date(saleDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(saleDate) > new Date(dateTo + 'T23:59:59')) return false;
    if (branchFilter !== 'all' && s.branchId !== branchFilter) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    const expDate = (e as any).date || (e as any).createdAt;
    if (!expDate) return true;
    if (dateFrom && new Date(expDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(expDate) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgTransaction = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const inventoryValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const dailyRevenueData = Object.entries(
    filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([date, amount]) => ({ date, amount, name: labels.dailyRevenue }));

  const paymentData = Object.entries(
    filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const productSalesData = filteredSales
    .flatMap(s => (s.items || []).map(i => ({
      productName: (i as any).productName || 'Unknown',
      quantity: i.quantity,
    })))
    .reduce((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>)
  const topProducts = Object.entries(productSalesData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity: quantity as number }));

  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      const cat = p.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + p.stock;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const expenseCategoryData = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const monthlyExpenseData = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      const date = (e as any).date || (e as any).createdAt;
      if (!date) return acc;
      const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([month, amount]) => ({ month, amount: amount as number }));

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    let data: string[][] = [];
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}`;

    if (reportType === 'sales') {
      data = [['Date', 'Sale #', 'Amount', 'Payment', 'Customer'], ...filteredSales.map(s => [
        new Date(s.createdAt).toLocaleDateString(),
        s.saleNumber,
        String(s.totalAmount),
        s.paymentMethod,
        s.customerName || '-',
      ])];
    } else if (reportType === 'expenses') {
      data = [['Date', 'Description', 'Category', 'Amount'], ...filteredExpenses.map(e => [
        (e as any).date || '',
        e.description,
        e.category,
        String(e.amount),
      ])];
    } else if (reportType === 'inventory') {
      data = [['SKU', 'Name', 'Stock', 'Cost', 'Price', 'Status'], ...products.map(p => [
        p.sku,
        p.name,
        String(p.stock),
        String(p.cost),
        String(p.price),
        p.stock === 0 ? 'Out' : p.stock <= p.lowStockThreshold ? 'Low' : 'OK',
      ])];
    }

    if (type === 'csv') {
      const csv = data.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
    } else if (type === 'excel') {
      const tsv = data.map(r => r.join('\t')).join('\n');
      const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.xls`;
      a.click();
    } else if (type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${filename}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
              </style>
            </head>
            <body>
              <h2>${businessSettings?.businessName || 'Report'}</h2>
              <p>${reportType} Report - ${dateFrom || 'All'} to ${dateTo || 'All'}</p>
              <table>
                <thead>
                  <tr>${data[0]?.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${data.slice(1).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.split(','));
      const headers = lines[0];
      const rows = lines.slice(1);

      if (reportType === 'inventory') {
        for (const row of rows) {
          if (row.length < 5) continue;
          const [sku, name, stock, cost, price] = row;
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name?.trim() || sku,
              sku: sku?.trim() || sku,
              stock: parseInt(stock) || 0,
              cost: parseFloat(cost) || 0,
              price: parseFloat(price) || 0,
            }),
          });
        }
      } else if (reportType === 'expenses') {
        for (const row of rows) {
          if (row.length < 4) continue;
          const [date, description, category, amount] = row;
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: description?.trim() || 'Imported',
              category: category?.trim() || 'Other',
              amount: parseFloat(amount) || 0,
              date: date?.trim() || new Date().toISOString().split('T')[0],
            }),
          });
        }
      }

      setImportFile(null);
      fetchData();
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Reports</h1>
              <p className="text-xs text-slate-500">Generate and export reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 cursor-pointer flex items-center gap-2">
              <Download className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    handleImport(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Report Type Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['sales', 'expenses', 'inventory', 'profitLoss', 'cashFlow', 'custom'] as const).map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {labels[type] || type}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quick Dates</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePresetFn(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Custom</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <button
              onClick={() => handleExport(exportFormat)}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Report Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h2 className="font-bold text-lg">{businessSettings?.businessName || 'DUKA JANJA'}</h2>
          <p className="text-sm text-slate-500">
            {labels[reportType]} Report
            {dateFrom && dateTo && ` • ${dateFrom} to ${dateTo}`}
            {dateFrom && !dateTo && ` • From ${dateFrom}`}
            {!dateFrom && dateTo && ` • Until ${dateTo}`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <>
            {/* Sales Report */}
            {reportType === 'sales' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.totalSales}</p>
                    <p className="text-xl font-bold text-blue-600">{filteredSales.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.totalRevenue}</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.avgTransaction}</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(avgTransaction, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.topPayment}</p>
                    <p className="text-xl font-bold text-slate-800">
                      {paymentData.sort((a, b) => b.value - a.value)[0]?.name || '-'}
                    </p>
                  </div>
                </div>

                {/* Daily Revenue Chart */}
                {dailyRevenueData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 mb-4">{labels.dailyRevenue}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="amount" name={labels.totalRevenue} fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Method Pie */}
                  {paymentData.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-700 mb-4">{labels.byPayment}</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}
                          >
                            {paymentData.map((entry, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Top Products */}
                  {topProducts.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-700 mb-4">{labels.topProducts}</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="quantity" name="Qty" fill="#2563eb" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Sale #</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Customer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.slice(0, 20).map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{sale.saleNumber}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {formatCurrency(sale.totalAmount, currency)}
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">{sale.paymentMethod}</td>
                          <td className="px-4 py-3 text-sm">{sale.customerName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSales.length > 20 && (
                    <div className="px-4 py-2 text-center text-sm text-slate-500">
                      Showing 20 of {filteredSales.length} sales
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expenses Report */}
            {reportType === 'expenses' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Transactions</p>
                    <p className="text-xl font-bold text-slate-800">{filteredExpenses.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Avg Expense</p>
                    <p className="text-xl font-bold text-slate-800">
                      {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0, currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {expenseCategoryData.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-700 mb-4">{labels.byCategory}</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            nameKey="name"
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {monthlyExpenseData.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-700 mb-4">{labels.monthlyExpense}</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyExpenseData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="amount" name="Amount" fill="#dc2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredExpenses.slice(0, 20).map(expense => (
                        <tr key={expense.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{expense.date}</td>
                          <td className="px-4 py-3 text-sm">{expense.description}</td>
                          <td className="px-4 py-3 text-sm">{expense.category}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                            {formatCurrency(expense.amount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inventory Report */}
            {reportType === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.totalProducts}</p>
                    <p className="text-xl font-bold text-blue-600">{products.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.lowStock}</p>
                    <p className="text-xl font-bold text-amber-600">{lowStockCount}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.outOfStock}</p>
                    <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">{labels.inventoryValue}</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(inventoryValue, currency)}</p>
                  </div>
                </div>

                {categoryData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 mb-4">{labels.stockByCategory}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Stock" fill="#0891b2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Price</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.slice(0, 20).map(product => (
                        <tr key={product.id} className={`hover:bg-slate-50 ${product.stock === 0 ? 'bg-red-50' : product.stock <= product.lowStockThreshold ? 'bg-amber-50' : ''}`}>
                          <td className="px-4 py-3 text-sm font-mono">{product.sku}</td>
                          <td className="px-4 py-3 text-sm">{product.name}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{product.stock}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatCurrency(product.cost, currency)}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatCurrency(product.price, currency)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              product.stock === 0 ? 'bg-red-100 text-red-700' :
                              product.stock <= product.lowStockThreshold ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {product.stock === 0 ? 'Out' : product.stock <= product.lowStockThreshold ? 'Low' : 'OK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Profit & Loss */}
            {reportType === 'profitLoss' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Expenses</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Net Profit</p>
                    <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit, currency)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-700 mb-4">Profit & Loss Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Revenue', value: totalRevenue },
                      { name: 'Expenses', value: totalExpenses },
                      { name: 'Profit', value: netProfit },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'Revenue', value: totalRevenue },
                          { name: 'Expenses', value: totalExpenses },
                          { name: 'Profit', value: netProfit },
                        ].map((entry, index) => (
                          <Cell key={index} fill={index === 2 ? (netProfit >= 0 ? '#059669' : '#dc2626') : COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Cash Flow */}
            {reportType === 'cashFlow' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Cash In</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Cash Out</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses, currency)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500">Net Cash Flow</p>
                    <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit, currency)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-700 mb-4">Cash Flow Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Custom Report */}
            {reportType === 'custom' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-700 mb-4">Custom Report Builder</h3>
                <p className="text-slate-500">Select metrics to include in your report:</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Sales Count', 'Total Revenue', 'Average Sale', 'Top Products', 'Payment Methods', 'Daily Trends', 'Customer Analysis', 'Product Categories'].map(metric => (
                    <label key={metric} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{metric}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Generate
                  </button>
                  <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                    Save Template
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}