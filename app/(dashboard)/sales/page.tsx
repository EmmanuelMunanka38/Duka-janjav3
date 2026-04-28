'use client';

import { useEffect, useState } from 'react';
import { Receipt, Search, Filter, Download, Printer, RotateCcw, XCircle, Eye, FileText, Building2 } from 'lucide-react';
import { useAppStore, Branch } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  change: number;
  paymentMethod: string;
  paymentRef?: string;
  status: 'completed' | 'partial' | 'pending' | 'voided' | 'refunded';
  customerName: string | null;
  customerContact: string | null;
  branchId: string | null;
  items: { quantity: number; product: { name: string }; unitPrice: number; totalPrice: number }[];
  createdAt: string;
}

export default function SalesPage() {
  const { currency, t, branches, currentBranch } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [dateFrom, dateTo, branchFilter]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      
      const res = await fetch(`/api/sales?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setSales(data);
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

  const filteredSales = sales.filter(s => {
    const matchesSearch = !searchQuery || 
      s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  const paymentMethodCounts = filteredSales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topPaymentMethod = Object.entries(paymentMethodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-orange-100 text-orange-700',
      voided: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      completed: 'Paid',
      partial: 'Partial',
      pending: 'Pending',
      voided: 'Voided',
      refunded: 'Refunded',
    };
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return '-';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || '-';
  };

  const handlePrint = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      ['Sale #', 'Date', 'Branch', 'Customer', 'Payment Method', 'Payment Ref', 'Status', 'Total'],
      ...filteredSales.map(s => [
        s.saleNumber,
        new Date(s.createdAt).toLocaleString('en-GB'),
        getBranchName(s.branchId),
        s.customerName || 'Walk-in',
        s.paymentMethod,
        s.paymentRef || '-',
        s.status,
        `${currencySymbol}${s.totalAmount.toFixed(2)}`,
      ]),
      ['', '', '', '', '', '', 'Total:', `${currencySymbol}${totalRevenue.toFixed(2)}`],
    ];
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('common', 'sales')}</h1>
              <p className="text-xs text-slate-500">{t('reports', 'salesReports')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
            <button
              onClick={() => fetchSales()}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('reports', 'totalSales')}</p>
            <p className="text-xl font-bold text-green-600">{totalSales}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('dashboard', 'revenue')}</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('reports', 'avgSaleValue')}</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(avgTransaction, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('pos', 'paymentMethod')}</p>
            <p className="text-xl font-bold text-slate-800 capitalize">{topPaymentMethod}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common', 'search')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">{t('branches', 'allBranches')}</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">{t('pos', 'paymentMethod')}: All</option>
            <option value="cash">{t('pos', 'cash')}</option>
            <option value="card">{t('pos', 'card')}</option>
            <option value="mobile">{t('pos', 'mobile')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">{t('common', 'status')}: All</option>
            <option value="completed">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="voided">Voided</option>
            <option value="refunded">Refunded</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sale #</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('common', 'date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('branches', 'title')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('pos', 'customerName')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'total')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('pos', 'paymentMethod')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Payment Ref</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'status')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        {t('reports', 'noSales')}
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm text-slate-800">{sale.saleNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(sale.createdAt).toLocaleDateString('en-GB')} {new Date(sale.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {getBranchName(sale.branchId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {sale.customerName || 'Walk-in'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-sm text-green-600">{formatCurrency(sale.totalAmount, currency)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                            sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                          {sale.paymentRef || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(sale.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePrint(sale)}
                              className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(sale)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.location.href = `/sales/returns?sale=${sale.saleNumber}`}
                              className="p-1.5 hover:bg-slate-100 rounded text-orange-600"
                              title="Refund"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('common', 'sales')} Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            
            <div className="p-6" id="invoice-content">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">DUKA JANJA</h2>
                <p className="text-sm text-slate-500">P.O. Box 12345, Nairobi</p>
                <p className="text-sm text-slate-500">PIN: A123456789X</p>
              </div>

              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm font-bold">{selectedSale.saleNumber}</p>
                  <p className="text-xs text-slate-500">{new Date(selectedSale.createdAt).toLocaleString('en-GB')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm"><span className="text-slate-500">Customer:</span> {selectedSale.customerName || 'Walk-in'}</p>
                  {selectedSale.customerContact && <p className="text-xs text-slate-500">{selectedSale.customerContact}</p>}
                </div>
              </div>

              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-bold text-slate-500">Product</th>
                    <th className="text-center py-2 text-xs font-bold text-slate-500">Qty</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Price</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 text-sm">{item.product.name}</td>
                      <td className="py-2 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(item.unitPrice, currency)}</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(item.totalPrice, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('common', 'subtotal')}</span>
                  <span>{formatCurrency(selectedSale.totalAmount / 1.08, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('common', 'tax')} (8%)</span>
                  <span>{formatCurrency(selectedSale.totalAmount - selectedSale.totalAmount / 1.08, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2">
                  <span>{t('common', 'total')}</span>
                  <span className="text-green-600">{formatCurrency(selectedSale.totalAmount, currency)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm"><span className="font-medium">{t('pos', 'paymentMethod')}:</span> {selectedSale.paymentMethod}</p>
                {selectedSale.paymentRef && <p className="text-sm"><span className="font-medium">Ref:</span> {selectedSale.paymentRef}</p>}
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}