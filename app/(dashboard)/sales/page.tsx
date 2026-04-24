'use client';

import { useEffect, useState } from 'react';
import { Receipt, Search, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  status: string;
  customer: { name: string } | null;
  customerName: string | null;
  items: { quantity: number; product: { name: string }; unitPrice: number; totalPrice: number }[];
  createdAt: string;
}

interface DailyTotal {
  date: string;
  total: number;
  count: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { currency } = useAppStore();

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = '';

      if (dateFilter === 'today') {
        startDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const params = startDate ? `?startDate=${startDate}` : '';
      const res = await fetch(`/api/sales${params}`);
      
      if (res.ok) {
        setSales(await res.json());
      } else {
        setSales([]);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  let filteredSales = sales.filter(s => {
    const matchesSearch = s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransactions = filteredSales.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const dailyTotals = (() => {
    const acc: Record<string, { total: number; count: number }> = {};
    filteredSales.forEach((sale) => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += sale.totalAmount;
      acc[date].count += 1;
    });
    return Object.entries(acc).map(([date, data]) => ({ date, total: data.total, count: data.count }));
  })();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Sales History</h1>
              <p className="text-xs text-slate-500">View and manage sales records</p>
            </div>
          </div>
          <button
            onClick={() => fetchSales()}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Transactions</p>
                <p className="text-xl font-bold text-slate-800">{totalTransactions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg. Transaction</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(avgTransaction, currency)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sales..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No sales found</h3>
            <p className="text-slate-500">Sales will appear here after transactions</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sale #</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm text-slate-800">{sale.saleNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(sale.createdAt)} {new Date(sale.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {sale.customerName || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                        sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm text-green-600">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sale Details</h3>
                <p className="text-sm text-slate-500">{selectedSale.saleNumber}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-1 hover:bg-slate-100 rounded">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-800">{new Date(selectedSale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Customer</span>
                <span className="text-slate-800">{selectedSale.customerName || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment</span>
                <span className="text-slate-800 capitalize">{selectedSale.paymentMethod}</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-slate-800">{formatCurrency(item.totalPrice, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-800">{formatCurrency(selectedSale.totalAmount / 1.08, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax (8%)</span>
                  <span className="text-slate-800">{formatCurrency(selectedSale.totalAmount - selectedSale.totalAmount / 1.08, currency)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(selectedSale.totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}