'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Search, RefreshCw, Eye, Check, X, AlertTriangle, Clock, ChevronRight, FileText } from 'lucide-react';
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
  paymentRef: string | null;
  status: string;
  customerName: string | null;
  customerContact: string | null;
  branchId: string | null;
  branch: Branch | null;
  items: { quantity: number; unitPrice: number; totalPrice: number; product: { id: string; name: string } }[];
  createdAt: string;
}

interface SaleReturn {
  id: string;
  returnNumber: string;
  saleId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  branchId: string | null;
  branch: Branch | null;
  sale: Sale;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
  processedBy: { name: string } | null;
}

const RETURN_REASONS: Record<string, { label: string; labelSw: string }> = {
  defective: { label: 'Defective Product', labelSw: 'Bidhaa Iliyoharibika' },
  wrong_item: { label: 'Wrong Item Received', labelSw: 'Kitu Mbili Kilichopokelewa' },
  not_as_described: { label: 'Not as Described', labelSw: 'Haiendani Maelezo' },
  changed_mind: { label: 'Customer Changed Mind', labelSw: 'Mteja Alibadili Mawazo' },
  size_fit: { label: 'Wrong Size/Fit', labelSw: 'Ukubwa/Ukoji Hazilingani' },
  quality: { label: 'Quality Issues', labelSw: 'Maswala ya Ubora' },
  late_delivery: { label: 'Late Delivery', labelSw: 'Uwasilishaji Ulichelewa' },
  other: { label: 'Other', labelSw: 'Nyingine' },
};

export default function SalesReturnsPage() {
  const { currency, t, branches, currentBranch } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [returnAmount, setReturnAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);

      const [salesRes, returnsRes] = await Promise.all([
        fetch(`/api/sales?${params.toString()}`),
        fetch(`/api/sales/returns?${params.toString()}`),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (returnsRes.ok) setReturns(await returnsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(r => {
    const matchesSearch = !searchQuery || r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) || r.sale?.saleNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSales = sales.filter(s => {
    const matchesSearch = !searchQuery || s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) || s.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pendingReturns = returns.filter(r => r.status === 'pending');
  const approvedReturns = returns.filter(r => r.status === 'approved');
  const completedReturns = returns.filter(r => r.status === 'completed');
  const totalPendingAmount = pendingReturns.reduce((sum, r) => sum + r.amount, 0);
  const totalRefundedAmount = completedReturns.reduce((sum, r) => sum + r.amount, 0);

  const handleCreateReturn = async () => {
    if (!selectedSale || !reason) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          amount: parseFloat(returnAmount) || selectedSale.totalAmount,
          reason,
          notes,
          branchId: currentBranch?.id || null,
        }),
      });

      if (res.ok) {
        setShowReturnModal(false);
        setSelectedSale(null);
        setReason('');
        setNotes('');
        setReturnAmount('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveReturn = async () => {
    if (!selectedReturn) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReturn.id, status: 'approved' }),
      });

      if (res.ok) {
        setShowApproveModal(false);
        setSelectedReturn(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error approving return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!selectedReturn) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReturn.id, status: 'rejected', notes }),
      });

      if (res.ok) {
        setShowApproveModal(false);
        setSelectedReturn(null);
        setNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Error rejecting return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!selectedReturn) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReturn.id, status: 'completed' }),
      });

      if (res.ok) {
        setShowProcessModal(false);
        setSelectedReturn(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error processing return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      pending: t('returns', 'statusPending'),
      approved: t('returns', 'statusApproved'),
      rejected: t('returns', 'statusRejected'),
      completed: t('returns', 'statusCompleted'),
      cancelled: t('returns', 'statusCancelled'),
    };
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || 'bg-slate-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getReasonLabel = (reasonKey: string) => {
    const reason = RETURN_REASONS[reasonKey];
    return reason ? reason.labelSw : reasonKey;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('common', 'returns')}</h1>
              <p className="text-xs text-slate-500">{t('returns', 'subtitle')}</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-slate-100 rounded-lg">
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('returns', 'pendingRequests')}</p>
            <p className="text-xl font-bold text-orange-600">{pendingReturns.length}</p>
            <p className="text-xs text-slate-400">{formatCurrency(totalPendingAmount, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('returns', 'approved')}</p>
            <p className="text-xl font-bold text-blue-600">{approvedReturns.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('returns', 'totalRefunded')}</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalRefundedAmount, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{t('reports', 'avgSaleValue')}</p>
            <p className="text-xl font-bold text-slate-800">{returns.length > 0 ? formatCurrency(totalRefundedAmount / completedReturns.length, currency) : formatCurrency(0, currency)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common', 'search')} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary">
            <option value="all">{t('branches', 'allBranches')}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary">
            <option value="all">{t('common', 'status')}: All</option>
            <option value="pending">{t('returns', 'statusPending')}</option>
            <option value="approved">{t('returns', 'statusApproved')}</option>
            <option value="completed">{t('returns', 'statusCompleted')}</option>
            <option value="rejected">{t('returns', 'statusRejected')}</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <>
            {pendingReturns.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-600 mb-3">{t('returns', 'requiresApproval')}</h2>
                <div className="space-y-3">
                  {pendingReturns.slice(0, 5).map(r => (
                    <div key={r.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{r.returnNumber}</p>
                          <p className="text-sm text-slate-500">{r.sale?.saleNumber} • {getReasonLabel(r.reason)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{formatCurrency(r.amount, currency)}</p>
                          <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
                        </div>
                        <button onClick={() => { setSelectedReturn(r); setShowApproveModal(true); }} className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700">
                          {t('common', 'review')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Return #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sale #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('branches', 'title')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('pos', 'reason')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('common', 'amount')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'status')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReturns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">{t('returns', 'noReturns')}</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReturns.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3"><span className="font-medium text-sm text-slate-800">{r.returnNumber}</span></td>
                          <td className="px-4 py-3 text-sm text-slate-600">{r.sale?.saleNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{r.branch?.name || currentBranch?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{getReasonLabel(r.reason)}</td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(r.amount, currency)}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setSelectedReturn(r); setShowProcessModal(true); }} className="p-1.5 hover:bg-slate-100 rounded text-blue-600" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              {r.status === 'pending' && (
                                <button onClick={() => { setSelectedReturn(r); setShowApproveModal(true); }} className="p-1.5 hover:bg-slate-100 rounded text-green-600" title="Approve">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {r.status === 'approved' && (
                                <button onClick={() => { setSelectedReturn(r); setShowProcessModal(true); }} className="p-1.5 hover:bg-slate-100 rounded text-green-600" title="Process">
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-bold text-slate-600 mb-3">{t('returns', 'availableSales')}</h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sale #</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('common', 'date')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('pos', 'customerName')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('pos', 'items')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('common', 'total')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.slice(0, 20).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3"><span className="font-medium text-sm text-slate-800">{s.saleNumber}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{s.customerName || t('pos', 'walkInCustomer')}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{s.items.length}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(s.totalAmount, currency)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => { setSelectedSale(s); setReturnAmount(s.totalAmount.toString()); setShowReturnModal(true); }} className="px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded border border-orange-200">
                            {t('common', 'processReturn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {showReturnModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('returns', 'newReturn')}</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">{t('pos', 'saleNumber')}</span>
                  <span className="font-bold">{selectedSale.saleNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{t('common', 'total')}</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(selectedSale.totalAmount, currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('pos', 'returnAmount')}</label>
                <input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} max={selectedSale.totalAmount} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('pos', 'reason')}</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary">
                  <option value="">{t('common', 'select')}</option>
                  {Object.entries(RETURN_REASONS).map(([key, val]) => (
                    <option key={key} value={key}>{val.labelSw}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('common', 'notes')} ({t('common', 'optional')})</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowReturnModal(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                  {t('common', 'cancel')}
                </button>
                <button onClick={handleCreateReturn} disabled={!reason || processing} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {processing ? t('common', 'processing') : t('returns', 'submitReturn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('returns', 'approveReturn')}</h3>
              <button onClick={() => setShowApproveModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Return #</span>
                  <span className="font-bold">{selectedReturn.returnNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">{t('pos', 'saleNumber')}</span>
                  <span className="font-bold">{selectedReturn.sale?.saleNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{t('common', 'amount')}</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(selectedReturn.amount, currency)}</span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-orange-700"><span className="font-medium">{t('pos', 'reason')}:</span> {getReasonLabel(selectedReturn.reason)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('common', 'notes')} ({t('common', 'optional')})</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleRejectReturn} disabled={processing} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> {t('returns', 'reject')}
                </button>
                <button onClick={handleApproveReturn} disabled={processing} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {t('returns', 'approve')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProcessModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{t('returns', 'processReturn')}</h3>
              <button onClick={() => setShowProcessModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Return #</span>
                  <span className="font-bold">{selectedReturn.returnNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{t('pos', 'saleNumber')}</span>
                  <span className="font-bold">{selectedReturn.sale?.saleNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{t('pos', 'reason')}</span>
                  <span>{getReasonLabel(selectedReturn.reason)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-medium text-slate-500">{t('common', 'amount')}</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(selectedReturn.amount, currency)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-700">{t('returns', 'refundNote')}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowProcessModal(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                  {t('common', 'cancel')}
                </button>
                <button onClick={handleProcessReturn} disabled={processing} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {processing ? t('common', 'processing') : t('returns', 'processRefund')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}