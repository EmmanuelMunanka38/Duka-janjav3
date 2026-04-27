'use client';

import { useEffect, useState } from 'react';
import TopNav from '@/components/layout/TopNav';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import Link from 'next/link';
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  customerName: string | null;
  createdAt: string;
  items: { product: { name: string } }[];
}

interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  price: number;
  category: string | null;
}

interface ChartData {
  date: string;
  sales: number;
  label: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function DashboardPage() {
  const { user, setUser, currency, t } = useAppStore();
  const [todaySales, setTodaySales] = useState(0);
  const [weekSales, setWeekSales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [paymentData, setPaymentData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Session error:', err);
      }
    };
    
    if (!user) {
      initSession();
    }
  }, [user, setUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [todayRes, weekRes, monthRes, productsRes] = await Promise.all([
          fetch(`/api/sales?startDate=${today}`),
          fetch(`/api/sales?startDate=${weekAgo.toISOString().split('T')[0]}`),
          fetch(`/api/sales?startDate=${monthAgo.toISOString().split('T')[0]}`),
          fetch('/api/products'),
        ]);

        const processSales = async (res: Response) => {
          if (res.ok) {
            return res.json();
          }
          return [];
        };

        const todayData = await processSales(todayRes);
        const weekData: Sale[] = await processSales(weekRes);
        const monthData: Sale[] = await processSales(monthRes);

        setTodaySales(todayData.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0));
        setWeekSales(weekData.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0));
        setMonthSales(monthData.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0));
        setTransactionCount(todayData.length);
        
        const avgValue = todayData.length > 0 ? todayData.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0) / todayData.length : 0;
        setAvgOrderValue(avgValue);

        const trendMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          trendMap[dateStr] = 0;
        }
        
        weekData.forEach((s: Sale) => {
          const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
          if (trendMap.hasOwnProperty(dateStr)) {
            trendMap[dateStr] += s.totalAmount;
          }
        });

        const formattedChartData = Object.entries(trendMap)
          .map(([date, sales]) => ({
            date,
            sales,
            label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setChartData(formattedChartData);
        setRecentSales(weekData.slice(0, 6));

        if (productsRes.ok) {
          const products: Product[] = await productsRes.json();
          setTotalProducts(products.length);
          const lowStock = products.filter(p => p.stock <= p.lowStockThreshold);
          setLowStockProducts(lowStock);

          const categoryMap: Record<string, number> = {};
          products.forEach(p => {
            const cat = p.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
          });

          const categoryColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
          const categoryArray = Object.entries(categoryMap).map(([name, value], idx) => ({
            name,
            value,
            color: categoryColors[idx % categoryColors.length],
          }));
          setCategoryData(categoryArray);
        }

        const paymentMap: Record<string, number> = {};
        weekData.forEach((s: Sale) => {
          paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] || 0) + s.totalAmount;
        });
        const paymentArray = Object.entries(paymentMap).map(([name, value], idx) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[idx % COLORS.length],
        }));
        setPaymentData(paymentArray);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-sm text-primary">
            {t('reports', 'totalSales')}: {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <TopNav />
        <div className="p-8">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>

      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t('dashboard', 'welcomeTitle')}{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-slate-500">{t('dashboard', 'welcomeSubtitle')}</p>
          </div>
          <Link
            href="/pos"
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold flex items-center gap-2 hover:opacity-90"
          >
            <ShoppingCart className="w-5 h-5" />
            {t('dashboard', 'newSale')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {t('reports', 'todaySales')}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{formatCurrency(todaySales, currency)}</p>
            <p className="text-xs text-slate-500 mt-1">{t('reports', 'todaySales')}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {t('reports', 'week')}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{formatCurrency(weekSales, currency)}</p>
            <p className="text-xs text-slate-500 mt-1">{t('dashboard', 'weekSales')}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {t('reports', 'month')}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{formatCurrency(monthSales, currency)}</p>
            <p className="text-xs text-slate-500 mt-1">{t('dashboard', 'monthSales')}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-orange-100 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-bold flex items-center gap-1">
                {lowStockProducts.length} {t('dashboard', 'lowStock')}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-3">{totalProducts}</p>
            <p className="text-xs text-slate-500 mt-1">{t('inventory', 'totalProducts')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('dashboard', 'revenue')}</h3>
                <p className="text-sm text-slate-500">{t('reports', 'week')} - {t('reports', 'month')}</p>
              </div>
              <Link href="/reports" className="text-primary text-sm font-medium hover:underline">
                {t('dashboard', 'viewAll')}
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value, currency)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('reports', 'salesByCategory')}</h3>
                <p className="text-sm text-slate-500">{t('analytics', 'products')}</p>
              </div>
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                {t('analytics', 'noData')}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{t('dashboard', 'recentTransactions')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('dashboard', 'saleNumber')}</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('pos', 'customerName')}</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('common', 'total')}</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('pos', 'paymentMethod')}</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('common', 'date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        {t('messages', 'noData')}
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="font-medium text-sm text-slate-800">{sale.saleNumber}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-slate-600">{sale.customerName || t('pos', 'customerName')}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-bold text-slate-800">{formatCurrency(sale.totalAmount, currency)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 capitalize">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-slate-800">{t('dashboard', 'lowStock')}</h3>
              </div>
              {lowStockProducts.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('inventory', 'inStock')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => {
                    const stockPercent = Math.min((product.stock / product.lowStockThreshold) * 100, 100);
                    const isCritical = product.stock === 0;
                    return (
                      <div key={product.id} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-500">{t('inventory', 'sku')}: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${isCritical ? 'text-red-600' : 'text-orange-500'}`}>
                              {product.stock} {t('common', 'loading')}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {t('inventory', 'lowStockThreshold')}: {product.lowStockThreshold}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritical ? 'bg-red-500' : stockPercent < 30 ? 'bg-orange-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{t('pos', 'paymentMethod')}</h3>
              <p className="text-sm text-slate-500">{t('reports', 'week')}</p>
            </div>
          </div>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value, currency)} />
                <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400">
              {t('analytics', 'noData')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}