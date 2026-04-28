'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Search, Plus, Send, Edit, Trash2, Eye, FileText, X, Package, Truck, DollarSign, Check, Printer } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { id: string; name: string } | null;
  branchId: string | null;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  paymentDate: string;
}

const STATUS_WORKFLOW = ['draft', 'ordered', 'received', 'invoiced', 'paid'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ordered: 'Ordered',
  received: 'Received',
  invoiced: 'Invoiced',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-yellow-100 text-yellow-700',
  invoiced: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PurchasesPage() {
  const { currency, branches } = useAppStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const [formSupplierId, setFormSupplierId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<PurchaseItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

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

      const [ordersRes, productsRes, suppliersRes] = await Promise.all([
        fetch(`/api/purchases?${params.toString()}`),
        fetch('/api/products'),
        fetch('/api/suppliers'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const enriched = data.map((o: Record<string, unknown>) => ({
          ...o,
          supplier: o.supplierId ? { id: o.supplierId as string, name: (o as { supplier?: { id: string; name: string } }).supplier?.name || 'Unknown' } : null,
        }));
        setOrders(enriched);
      }
      if (productsRes.ok) setProducts(await productsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPurchases = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = filteredOrders.filter(o => o.status === 'draft' || o.status === 'ordered').length;
  const paidCount = filteredOrders.filter(o => o.status === 'paid').length;

  const getStatusBadge = (status: string) => (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return '-';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || '-';
  };

  const addLineItem = (product: Product) => {
    if (formItems.find(i => i.productId === product.id)) return;
    const newItem: PurchaseItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitCost: product.cost,
      totalCost: product.cost,
    };
    setFormItems([...formItems, newItem]);
    setItemSearch('');
  };

  const updateLineItem = (id: string, field: 'quantity' | 'unitCost', value: number) => {
    setFormItems(formItems.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.totalCost = updated.quantity * updated.unitCost;
      return updated;
    }));
  };

  const removeLineItem = (id: string) => {
    setFormItems(formItems.filter(item => item.id !== id));
  };

  const formTotal = formItems.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSaveDraft = async () => {
    if (!formSupplierId || formItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: formSupplierId,
          branchId: formBranchId || null,
          expectedDate: formExpectedDate || null,
          notes: formNotes || null,
          items: formItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })),
          status: 'draft',
        }),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToSupplier = async (order: PurchaseOrder) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'ordered' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error sending to supplier:', err);
    }
  };

  const handleMarkReceived = async (order: PurchaseOrder) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'received' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error marking received:', err);
    }
  };

  const handleGenerateInvoice = async (order: PurchaseOrder) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'invoiced' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error generating invoice:', err);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !paymentAmount || !paymentMethod) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/purchases/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: selectedOrder.id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          reference: paymentRef,
          paymentDate: paymentDate || new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (order: PurchaseOrder) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'cancelled' }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const resetForm = () => {
    setFormSupplierId('');
    setFormBranchId('');
    setFormExpectedDate('');
    setFormNotes('');
    setFormItems([]);
    setEditingOrder(null);
  };

  const openEditModal = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormSupplierId(order.supplier?.id || '');
    setFormBranchId(order.branchId || '');
    setFormExpectedDate(order.expectedDate?.split('T')[0] || '');
    setFormNotes(order.notes || '');
    setFormItems(order.items.map(item => ({ ...item, id: item.id || crypto.randomUUID() })));
    setShowModal(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Purchases</h1>
              <p className="text-xs text-slate-500">Manage purchase orders</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-bold text-purple-600">{filteredOrders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Value</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalPurchases, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-xl font-bold text-orange-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Paid</p>
            <p className="text-xl font-bold text-green-600">{paidCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">PO#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Branch</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm text-slate-800">{order.orderNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {order.supplier?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {getBranchName(order.branchId)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-slate-600">{order.items.length}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-sm text-purple-600">{formatCurrency(order.totalAmount, currency)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {order.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => handleSendToSupplier(order)}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                  title="Send to Supplier"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(order)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order)}
                                  className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                  title="Cancel"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {order.status === 'ordered' && (
                              <>
                                <button
                                  onClick={() => handleMarkReceived(order)}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                  title="Mark Received"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(order)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {order.status === 'received' && (
                              <button
                                onClick={() => { setSelectedOrder(order); setShowPaymentModal(true); handleGenerateInvoice(order); }}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded"
                              >
                                Generate Invoice
                              </button>
                            )}
                            {order.status === 'invoiced' && (
                              <>
                                <button
                                  onClick={() => { setSelectedOrder(order); setPaymentAmount(String(order.totalAmount - order.paidAmount)); setShowPaymentModal(true); }}
                                  className="p-1.5 hover:bg-green-100 rounded text-green-600"
                                  title="Record Payment"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {order.status === 'paid' && (
                              <>
                                <button
                                  onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                                  className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                  title="Print"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {editingOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Supplier *</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Branch</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Line Items</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  />
                  {itemSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.filter(p => !formItems.some(i => i.productId === p.id)).slice(0, 10).map(p => (
                        <button
                          key={p.id}
                          onClick={() => addLineItem(p)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-slate-500 ml-2">({p.sku})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Product</th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-500 w-24">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 w-28">Unit Cost</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 w-28">Total</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                            Add products to the order
                          </td>
                        </tr>
                      ) : (
                        formItems.map(item => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-3 py-2">{item.productName}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => updateLineItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatCurrency(item.totalCost, currency)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeLineItem(item.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {formItems.length > 0 && (
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-purple-600">{formatCurrency(formTotal, currency)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
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
                  onClick={handleSaveDraft}
                  disabled={!formSupplierId || formItems.length === 0 || submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingOrder ? 'Update Draft' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Purchase Order Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6" id="po-content">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">PURCHASE ORDER</h2>
                <p className="text-sm text-slate-500">{selectedOrder.orderNumber}</p>
              </div>

              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm font-bold">Supplier: {selectedOrder.supplier?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Branch: {getBranchName(selectedOrder.branchId)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Date: {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB')}</p>
                  {selectedOrder.expectedDate && (
                    <p className="text-xs text-slate-500">Expected: {new Date(selectedOrder.expectedDate).toLocaleDateString('en-GB')}</p>
                  )}
                </div>
              </div>

              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-bold text-slate-500">Item</th>
                    <th className="text-center py-2 text-xs font-bold text-slate-500">Qty</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Unit Cost</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 text-sm">{item.productName}</td>
                      <td className="py-2 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(item.unitCost, currency)}</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(item.totalCost, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-600">{formatCurrency(selectedOrder.totalAmount, currency)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Notes:</span> {selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
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

      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Order</p>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
                <p className="text-lg font-bold text-purple-600 mt-1">
                  {formatCurrency(selectedOrder.totalAmount, currency)}
                </p>
                <p className="text-xs text-slate-500">
                  Paid: {formatCurrency(selectedOrder.paidAmount, currency)} | 
                  Due: {formatCurrency(selectedOrder.totalAmount - selectedOrder.paidAmount, currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Transaction reference"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || !paymentMethod || submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}