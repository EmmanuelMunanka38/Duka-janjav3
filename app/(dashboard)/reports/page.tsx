'use client';

import { useEffect, useState } from 'react';
import { Download, Receipt, DollarSign, Package } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  customerName: string | null;
  createdAt: string;
  items: { quantity: number; product: { name: string } }[];
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
  category: string | null;
}

export default function ReportsPage() {
  const { currency } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'inventory'>('sales');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      let startDate = '';

      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
          break;
      }

      const params = startDate ? `?startDate=${startDate}` : '';

      const [salesRes, expensesRes, productsRes] = await Promise.all([
        fetch(`/api/sales${params}`),
        fetch(`/api/expenses${params}`),
        fetch('/api/products'),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/reports?type=${reportType}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalSales - totalExpenses;
  const avgSaleValue = sales.length > 0 ? totalSales / sales.length : 0;

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
        <p className="mt-4 text-slate-500">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-background">Sales Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of store performance</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Sales</h3>
          <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalSales, currency)}</p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Expenses</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalExpenses, currency)}</p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Net Profit</h3>
          <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(profit, currency)}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Avg. Sale Value</h3>
          <p className="text-2xl font-bold mt-1">{formatCurrency(avgSaleValue, currency)}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === range
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['sales', 'expenses', 'inventory'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                reportType === type
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
        {reportType === 'sales' && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-4">Recent Sales</h3>
            <div className="space-y-3">
              {sales.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No sales found</p>
              ) : (
                sales.slice(0, 10).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{sale.saleNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString()} • {sale.paymentMethod} • {sale.items.length} items
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(sale.totalAmount, currency)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {reportType === 'expenses' && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No expenses found</p>
              ) : (
                expenses.slice(0, 10).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{expense.description}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(expense.date).toLocaleDateString()} • {expense.category}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">-{formatCurrency(expense.amount, currency)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {reportType === 'inventory' && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-4">Inventory Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Total Products</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Total Stock</p>
                <p className="text-xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Inventory Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(products.reduce((sum, p) => sum + p.stock * p.price, 0), currency)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {products.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {product.sku} • {product.stock} in stock</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">{formatCurrency(product.price, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
