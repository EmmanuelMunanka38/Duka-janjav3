'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Search, RefreshCw, Eye, Check, X, AlertTriangle, Package, FileText, ChevronDown, Printer } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { id: string; name: string } | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  items: { id: string; productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }[];
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  originalOrderId: string;
  supplierId: string;
  supplier: { name: string } | null;
  amount: number;
  reason: string;
  status: string;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
}

const RETURN_REASONS = [
  { value: 'defective', label: 'Defective Product' },
  { value: 'expired', label: 'Expired Product' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'overstock', label: 'Overstock' },
  { value: 'quality', label: 'Quality Issues' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

export default function PurchasesReturnsPage() {
  const { currency } = useAppStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formOrderId, setFormOrderId] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formItemId, setFormItemId] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [ordersRes, suppliersRes, returnsRes] = await Promise.all([
        fetch(`/api/purchases?status=received`),
        fetch('/api/suppliers'),
        fetch(`/api/purchases/returns?${params.toString()}`),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const enriched = data.map((o: Record<string, unknown>) => ({
          ...o,
          supplier: o.supplierId ? { id: o.supplierId as string, name: (o as { supplier?: { id: string; name: string } }).supplier?.name || 'Unknown' } : null,
        }));
        setOrders(enriched);
      }
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (returnsRes.ok) {
        const data = await returnsRes.json();
        setReturns(data.map((r: Record<string, unknown>) => ({
          ...r,
          supplier: r.supplierId ? { name: 'Supplier' } : null,
        })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPO = orders.find(o => o.id === formOrderId);
  const selectedSupplier = suppliers.find(s => s.id === formSupplierId);

  const filteredReturns = returns.filter(r => {
    const matchesSearch = !searchQuery ||
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalReturns = filteredReturns.reduce((sum, r) => sum + r.amount, 0);
  const pendingReturns = filteredReturns.filter(r => r.status === 'pending').length;
  const completedReturns = filteredReturns.filter(r => r.status === 'completed').length;

  const getStatusBadge = (status: string) => (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );

  const handleSelectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setFormOrderId(orderId);
      setFormSupplierId(order.supplier?.id || '');
      setFormAmount(String(order.totalAmount));
    }
  };

  const submitReturn = async () => {
    if (!formOrderId || !formSupplierId || !formReason || !formAmount) return;
    setProcessing(true);
    try {
      const order = orders.find(o => o.id === formOrderId);
      const item = order?.items.find(i => i.id === formItemId);

      const res = await fetch('/api/purchases/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalOrderId: formOrderId,
          supplierId: formSupplierId,
          amount: parseFloat(formAmount),
          reason: formReason,
          notes: formNotes,
          userId: 'system',
          items: item ? [{
            productId: item.productId,
            productName: item.productName,
            quantity: formQuantity,
            unitCost: item.unitCost,
            totalCost: item.unitCost * formQuantity,
          }] : [],
        }),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const approveReturn = async (returnId: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: returnId, status: 'approved' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error approving return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const rejectReturn = async (returnId: string) => {
    if (!confirm('Are you sure you want to reject this return?')) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: returnId, status: 'rejected' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error rejecting return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const completeReturn = async (returnId: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: returnId, status: 'completed' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error completing return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormOrderId('');
    setFormSupplierId('');
    setFormReason('');
    setFormNotes('');
    setFormAmount('');
    setFormItemId('');
    setFormQuantity(1);
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-red-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Purchase Returns</h1>
              <p className="text-xs text-slate-500">Process returns to suppliers</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            New Return
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Returns</p>
            <p className="text-xl font-bold text-red-600">{filteredReturns.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Value</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalReturns, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{pendingReturns}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Completed</p>
            <p className="text-xl font-bold text-green-600">{completedReturns}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search returns..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">DN#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Original PO</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Reason</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No purchase returns found
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((returnItem) => (
                      <tr key={returnItem.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm text-slate-800">{returnItem.returnNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(returnItem.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {returnItem.originalOrderId || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {returnItem.supplier?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-sm text-red-600">{formatCurrency(returnItem.amount, currency)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {RETURN_REASONS.find(r => r.value === returnItem.reason)?.label || returnItem.reason}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(returnItem.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setSelectedReturn(returnItem); setShowDetailModal(true); }}
                              className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {returnItem.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => approveReturn(returnItem.id)}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rejectReturn(returnItem.id)}
                                  className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {returnItem.status === 'approved' && (
                              <button
                                onClick={() => completeReturn(returnItem.id)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
                              >
                                Complete
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
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">New Purchase Return</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Purchase Order *</label>
                  <select
                    value={formOrderId}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select PO</option>
                    {orders.filter(o => o.status === 'received').map(o => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.supplier?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Supplier *</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPO && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-2">Order Items</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedPO.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>{item.productName}</span>
                        <span className="text-slate-500">Qty: {item.quantity} × {formatCurrency(item.unitCost, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Return Amount *</label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Reason *</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="">Select reason</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  disabled={!formOrderId || !formSupplierId || !formReason || !formAmount || processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? 'Processing...' : 'Create Debit Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Debit Note Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6" id="dn-content">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">DEBIT NOTE</h2>
                <p className="text-sm text-slate-500">{selectedReturn.returnNumber}</p>
              </div>

              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm font-bold">Supplier: {selectedReturn.supplier?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Original PO: {selectedReturn.originalOrderId || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Date: {new Date(selectedReturn.createdAt).toLocaleDateString('en-GB')}</p>
                  <p className="text-xs text-slate-500">Status: {STATUS_LABELS[selectedReturn.status] || selectedReturn.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-500">Reason</p>
                <p className="font-medium">{RETURN_REASONS.find(r => r.value === selectedReturn.reason)?.label || selectedReturn.reason}</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Return Amount</span>
                  <span className="text-red-600">{formatCurrency(selectedReturn.amount, currency)}</span>
                </div>
              </div>

              {selectedReturn.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Notes:</span> {selectedReturn.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print DN
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