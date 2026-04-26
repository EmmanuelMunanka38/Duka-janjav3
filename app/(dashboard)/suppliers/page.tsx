'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Truck, Plus, Search, Building2, Pencil, Trash2, X, 
  AlertTriangle, FileText, Printer, Eye, Package, DollarSign
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  creditBalance: z.number().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditBalance: number;
  purchaseOrders: PurchaseOrder[];
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
}

const LABELS = {
  en: {
    title: 'Suppliers',
    add: 'Add Supplier',
    edit: 'Edit Supplier',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    contactPerson: 'Contact Person',
    creditBalance: 'Credit Balance',
    status: 'Status',
    view: 'View',
    deactivate: 'Deactivate',
    activate: 'Activate',
    printStatement: 'Print Statement',
    purchaseHistory: 'Purchase Orders',
    noSuppliers: 'No suppliers found',
    inactive: 'Inactive',
  },
  sw: {
    title: 'Waguzi',
    add: 'Ongeza Muuzaji',
    edit: 'Hariri Muuzaji',
    name: 'Jina',
    phone: 'Simu',
    email: 'Email',
    address: 'Anwani',
    contactPerson: 'Mhusika',
    creditBalance: 'Salio Ya Mikopo',
    status: 'Hali',
    view: 'Angalia',
    deactivate: 'Lemaza',
    activate: 'Wezesha',
    printStatement: 'Chapisha RIPOTI',
    purchaseHistory: 'Orderi Za Ununuzi',
    noSuppliers: 'Hakuna muuzaji',
    inactive: 'Wasio Hai',
  },
};

export default function SuppliersPage() {
  const { currency, language } = useAppStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const labels = LABELS[language as keyof typeof LABELS] || LABELS.en;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierForm>();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        setSuppliers(await res.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);
    return matchesSearch;
  });

  const totalSuppliers = filteredSuppliers.length;
  const totalCredit = filteredSuppliers.reduce((sum, s) => sum + (s.creditBalance || 0), 0);

  const handleSave = async (data: SupplierForm) => {
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowModal(false);
        reset();
        setEditingSupplier(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this supplier?')) return;
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openDetail = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      creditBalance: supplier.creditBalance || 0,
    });
    setShowModal(true);
  };

  const getTotalOrders = (supplier: Supplier) => {
    return supplier.purchaseOrders?.reduce((sum, po) => sum + po.totalAmount, 0) || 0;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{labels.title}</h1>
              <p className="text-xs text-slate-500">Manage suppliers</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingSupplier(null); reset({ name: '', contactPerson: '', email: '', phone: '', address: '' }); setShowModal(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {labels.add}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{language === 'sw' ? 'Jumla Waguzi' : 'Total Suppliers'}</p>
            <p className="text-xl font-bold text-green-600">{totalSuppliers}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{labels.creditBalance}</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totalCredit, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Active Orders</p>
            <p className="text-xl font-bold text-slate-800">
              {filteredSuppliers.reduce((sum, s) => sum + (s.purchaseOrders?.filter(po => po.status === 'ordered').length || 0), 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-green-600 border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.name}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.contactPerson}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.phone}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{language === 'sw' ? 'Jumla Orderi' : 'Total Orders'}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{labels.creditBalance}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{labels.status}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      {labels.noSuppliers}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{supplier.name}</p>
                            {supplier.email && <p className="text-xs text-slate-500">{supplier.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{supplier.contactPerson || '-'}</td>
                      <td className="px-4 py-3 text-sm">{supplier.phone || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(getTotalOrders(supplier), currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${supplier.creditBalance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {supplier.creditBalance > 0 ? formatCurrency(supplier.creditBalance, currency) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(supplier)}
                            className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                            title={labels.view}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(supplier)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(supplier.id)}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600"
                            title={labels.deactivate}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingSupplier ? labels.edit : labels.add}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{labels.name} *</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{labels.contactPerson}</label>
                <input
                  {...register('contactPerson')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{labels.phone}</label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{labels.email}</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{labels.address}</label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
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
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">{selectedSupplier.name}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{language === 'sw' ? 'Jumla Orderi' : 'Total Orders'}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(getTotalOrders(selectedSupplier), currency)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">Orders</p>
                  <p className="text-lg font-bold text-slate-800">{selectedSupplier.purchaseOrders?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{labels.creditBalance}</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatCurrency(selectedSupplier.creditBalance || 0, currency)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{labels.phone}</p>
                  <p className="text-lg font-bold text-slate-800">{selectedSupplier.phone || '-'}</p>
                </div>
              </div>

              {selectedSupplier.purchaseOrders?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-slate-700 mb-3">{labels.purchaseHistory}</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left">PO #</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSupplier.purchaseOrders.slice(0, 10).map(po => (
                          <tr key={po.id} className="border-t border-slate-100">
                            <td className="px-4 py-2 font-medium">{po.orderNumber}</td>
                            <td className="px-4 py-2">{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(po.totalAmount, currency)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                po.status === 'paid' ? 'bg-green-100 text-green-700' :
                                po.status === 'invoiced' ? 'bg-purple-100 text-purple-700' :
                                po.status === 'received' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {labels.printStatement}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}