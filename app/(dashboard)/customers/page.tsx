'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, Plus, Search, User, Mail, Phone, MapPin, Pencil, Trash2, X, 
  AlertTriangle, ShoppingBag, FileText, Printer, CreditCard, Eye,
  DollarSign, Package, TrendingUp
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

const customerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.number().optional(),
  isCreditEnabled: z.boolean().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditBalance: number;
  creditLimit: number;
  isActive: boolean;
  sales: Sale[];
  createdAt: string;
}

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  createdAt: string;
}

const LABELS = {
  en: {
    title: 'Customers',
    add: 'Add Customer',
    edit: 'Edit Customer',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    branch: 'Branch',
    totalSpent: 'Total Spent',
    lastPurchase: 'Last Purchase',
    creditBalance: 'Credit Balance',
    creditLimit: 'Credit Limit',
    status: 'Status',
    view: 'View',
    deactivate: 'Deactivate',
    activate: 'Activate',
    saveStatement: 'Save Statement',
    printStatement: 'Print Statement',
    purchaseHistory: 'Purchase History',
    activityLog: 'Activity Log',
    noCustomers: 'No customers found',
    inactive: 'Inactive',
  },
  sw: {
    title: 'Wateja',
    add: 'Ongeza Mteja',
    edit: 'Hariri Mteja',
    name: 'Jina',
    phone: 'Simu',
    email: 'Email',
    address: 'Anwani',
    branch: 'Tawi',
    totalSpent: 'Jumla Aliyonunua',
    lastPurchase: 'Nunua Ya Mwisho',
    creditBalance: 'Salio Ya Mikopo',
    creditLimit: 'K Limit Ya Mikopo',
    status: 'Hali',
    view: 'Angalia',
    deactivate: 'Lemaza',
    activate: 'wezesha',
    saveStatement: 'hifadhi RIPOTI',
    printStatement: 'Chapisha RIPOTI',
    purchaseHistory: 'Historia Ya Mauzo',
    activityLog: 'Logi Ya Shughuli',
    noCustomers: 'Hakuna wateja',
    inactive: 'Wasio Hai',
  },
};

export default function CustomersPage() {
  const { currency, branches, language } = useAppStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const printRef = useRef<HTMLDivElement>(null);
  
  const labels = LABELS[language as keyof typeof LABELS] || LABELS.en;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = filteredCustomers.length;
  const totalCredit = filteredCustomers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const activeCustomers = filteredCustomers.filter(c => c.isActive).length;

  const handleSave = async (data: CustomerForm) => {
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowModal(false);
        reset();
        setEditingCustomer(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this customer?')) return;
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleActivate = async (customer: Customer) => {
    try {
      await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openDetail = async (customer: Customer) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        setSelectedCustomer(await res.json());
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit || 0,
    });
    setShowModal(true);
  };

  const getTotalSpent = (customer: Customer) => {
    return customer.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
  };

  const getLastPurchase = (customer: Customer) => {
    if (!customer.sales?.length) return '-';
    const sorted = [...customer.sales].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return new Date(sorted[0].createdAt).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{labels.title}</h1>
              <p className="text-xs text-slate-500">Manage customers</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingCustomer(null); reset({ name: '', email: '', phone: '', address: '', creditLimit: 0 }); setShowModal(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {labels.add}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{language === 'sw' ? 'Jumla Wateja' : 'Total Customers'}</p>
            <p className="text-xl font-bold text-blue-600">{totalCustomers}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{labels.inactive}</p>
            <p className="text-xl font-bold text-green-600">{activeCustomers}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{labels.creditBalance}</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totalCredit, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">{language === 'sw' ? 'Wateja wa Mikopo' : 'Credit Customers'}</p>
            <p className="text-xl font-bold text-slate-800">
              {filteredCustomers.filter(c => c.creditLimit > 0).length}
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.name}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.phone}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{labels.totalSpent}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{labels.lastPurchase}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{labels.creditBalance}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{labels.status}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      {labels.noCustomers}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className={`hover:bg-slate-50 ${!customer.isActive ? 'bg-slate-50 opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{customer.name}</p>
                            {customer.email && <p className="text-xs text-slate-500">{customer.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{customer.phone || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(getTotalSpent(customer), currency)}
                      </td>
                      <td className="px-4 py-3 text-sm">{getLastPurchase(customer)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${customer.creditBalance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {customer.creditLimit > 0 ? formatCurrency(customer.creditBalance, currency) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {customer.isActive ? 'Active' : labels.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(customer)}
                            className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                            title={labels.view}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(customer)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {customer.isActive ? (
                            <button
                              onClick={() => handleDeactivate(customer.id)}
                              className="p-1.5 hover:bg-red-100 rounded text-red-600"
                              title={labels.deactivate}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(customer)}
                              className="p-1.5 hover:bg-green-100 rounded text-green-600"
                              title={labels.activate}
                            >
                              <TrendingUp className="w-4 h-4" />
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
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCustomer ? labels.edit : labels.add}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{labels.phone}</label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{labels.email}</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{labels.address}</label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{labels.creditLimit}</label>
                  <input
                    {...register('creditLimit', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    {...register('isCreditEnabled')}
                    id="isCreditEnabled"
                    className="rounded"
                  />
                  <label htmlFor="isCreditEnabled" className="text-sm text-slate-600">
                    Enable Credit Account
                  </label>
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{labels.totalSpent}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(getTotalSpent(selectedCustomer), currency)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">Orders</p>
                  <p className="text-lg font-bold text-slate-800">{selectedCustomer.sales?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{labels.creditBalance}</p>
                  <p className="text-lg font-bold text-amber-600">
                    {formatCurrency(selectedCustomer.creditBalance || 0, currency)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">{labels.creditLimit}</p>
                  <p className="text-lg font-bold text-slate-800">
                    {selectedCustomer.creditLimit ? formatCurrency(selectedCustomer.creditLimit, currency) : '-'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-slate-700 mb-3">{labels.purchaseHistory}</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Sale #</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.sales?.slice(0, 10).map(sale => (
                        <tr key={sale.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium">{sale.saleNumber}</td>
                          <td className="px-4 py-2">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(sale.totalAmount, currency)}</td>
                          <td className="px-4 py-2 capitalize">{sale.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
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