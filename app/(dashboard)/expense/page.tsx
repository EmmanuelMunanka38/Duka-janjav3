'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Wallet, Calendar, TrendingDown, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  vendor: string | null;
  createdAt: string;
}

const categories = ['All', 'Supplies', 'Utilities', 'Rent', 'Transport', 'Software', 'Repairs', 'Marketing', 'Salaries', 'Insurance'];

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { currency } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data: Expense[] = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = categoryFilter === 'All'
    ? expenses
    : expenses.filter(exp => exp.category === categoryFilter);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonth = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Supplies: 'bg-blue-100 text-blue-700',
      Utilities: 'bg-yellow-100 text-yellow-700',
      Rent: 'bg-purple-100 text-purple-700',
      Transport: 'bg-green-100 text-green-700',
      Software: 'bg-indigo-100 text-indigo-700',
      Repairs: 'bg-orange-100 text-orange-700',
      Marketing: 'bg-pink-100 text-pink-700',
      Salaries: 'bg-red-100 text-red-700',
      Insurance: 'bg-cyan-100 text-cyan-700',
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const openAddModal = () => {
    setEditingExpense(null);
    reset({
      description: '',
      amount: 0,
      category: 'Supplies',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
    });
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    reset({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      vendor: expense.vendor || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ExpenseForm) => {
    try {
      const url = editingExpense ? `/api/expenses?id=${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save expense');
      }

      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete expense');
      }
      setDeleteConfirm(null);
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-red-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Expenses</h1>
              <p className="text-xs text-slate-500">Track your spending</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Expense Tracking</h2>
          <p className="text-slate-500">Monitor and manage your expenses</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Expenses</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(totalExpenses, currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">This Month</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(thisMonth, currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Transactions</p>
                <p className="text-xl font-bold text-slate-800">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-slate-800">{expense.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{expense.vendor || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-sm text-red-600">
                        {formatCurrency(expense.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-sm text-slate-600">
                    Total ({filteredExpenses.length} items)
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-red-600">
                    {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), currency)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <input
                  {...register('description')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  placeholder="Enter description"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  >
                    {categories.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Amount ($)</label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                  <input
                    {...register('date')}
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Vendor</label>
                  <input
                    {...register('vendor')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                    placeholder="Vendor name (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Expense?</h3>
              <p className="text-slate-500 text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
