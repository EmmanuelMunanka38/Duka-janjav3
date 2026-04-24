'use client';

import { useEffect, useState } from 'react';
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
  LineChart,
  Line,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  totalAmount: number;
  createdAt: string;
  items: { product: { category: string | null } }[];
}

interface Product {
  id: string;
  category: string | null;
  stock: number;
}

export default function AnalyticsPage() {
  const { currency } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      let startDate = '';

      switch (timeframe) {
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

      const [salesRes, productsRes] = await Promise.all([
        fetch(`/api/sales${params}`),
        fetch('/api/products'),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const avgDailySales = sales.length > 0 ? totalSales / (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365) : 0;

  const salesByDay = sales.reduce((acc: Record<string, number>, sale) => {
    const date = new Date(sale.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + sale.totalAmount;
    return acc;
  }, {});

  const chartData = Object.entries(salesByDay)
    .map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      sales: total,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const categoryCount = products.reduce((acc: Record<string, number>, p) => {
    const cat = p.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <main className="ml-64 min-h-screen flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
          <p className="mt-4 text-slate-500">Loading analytics...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <main className="ml-64 min-h-screen flex-1 overflow-auto">
        <header className="flex items-center justify-between px-4 py-2 h-14 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-lg">Analytics Dashboard</h1>
              <p className="text-xs text-slate-500">Insights and performance metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['week', 'month', 'year'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  timeframe === tf
                    ? 'bg-primary text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-background">Key Performance Indicators</h2>
            <p className="text-sm text-slate-500 mt-1">Overview of your business performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500">Total Sales</h3>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalSales, currency)}</p>
              <p className="text-xs text-slate-500 mt-1">This {timeframe}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500">Avg. Daily Sales</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(avgDailySales, currency)}</p>
              <p className="text-xs text-slate-500 mt-1">Per day average</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500">Transactions</h3>
              <p className="text-2xl font-bold mt-1">{sales.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total orders</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500">Products</h3>
              <p className="text-2xl font-bold mt-1">{products.length}</p>
              <p className="text-xs text-slate-500 mt-1">In catalog</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Sales Trend</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No sales data for this period
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Sales by Category</h3>
              <div className="h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No category data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-4">Daily Sales Bar</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No sales data for this period
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
