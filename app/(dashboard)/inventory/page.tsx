'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  PlusCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stock: z.number().int().min(0, 'Stock must be 0 or more'),
  lowStockThreshold: z.number().int().min(0).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  category: string | null;
  description: string | null;
  supplier?: { id: string; name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { currency, t } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
      ]);

      if (productsRes.ok) {
        const data: Product[] = await productsRes.json();
        setProducts(data);
        const cats = ['All', ...new Set(data.map(p => p.category).filter(Boolean))] as string[];
        setCategories(cats);
      }

      if (suppliersRes.ok) {
        const data: Supplier[] = await suppliersRes.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      stock: 0,
      lowStockThreshold: 5,
      category: '',
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      category: product.category || '',
      description: product.description || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      const url = editingProduct ? `/api/products?id=${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t('messages', 'saveError'));
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('messages', 'saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(t('messages', 'deleteError'));
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(t('messages', 'deleteError'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('inventory', 'title')}</h1>
              <p className="text-xs text-slate-500">{t('inventory', 'searchProducts')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('inventory', 'title')}</h2>
          <p className="text-slate-500">{t('inventory', 'searchProducts')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('inventory', 'totalProducts')}</p>
                <p className="text-xl font-bold text-slate-800">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('inventory', 'lowStock')}</p>
                <p className="text-xl font-bold text-red-600">{lowStockCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('inventory', 'stockValue')}</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(totalValue, currency)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('inventory', 'searchProducts')}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-primary text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t('inventory', 'addProduct')}
          </button>
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('inventory', 'productName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{t('inventory', 'category')}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('inventory', 'stock')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">{t('inventory', 'price')}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'status')}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">{t('common', 'actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {t('inventory', 'noProducts')}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-sm ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-slate-800'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sm text-slate-800">
                        {formatCurrency(product.price, currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > product.lowStockThreshold
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.stock > product.lowStockThreshold ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {product.stock > product.lowStockThreshold ? t('inventory', 'inStock') : t('inventory', 'lowStock')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
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
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? t('inventory', 'editProduct') : t('inventory', 'addProduct')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'productName')}</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={t('inventory', 'productName')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'sku')}</label>
                  <input
                    {...register('sku')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="SKU-001"
                  />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'category')}</label>
                  <input
                    {...register('category')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="Electronics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'price')}</label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'cost')}</label>
                  <input
                    {...register('cost', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="0.00"
                  />
                  {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'stock')}</label>
                  <input
                    {...register('stock', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="0"
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'lowStockThreshold')}</label>
                  <input
                    {...register('lowStockThreshold', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{t('inventory', 'description')}</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder={t('inventory', 'description')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  {t('common', 'cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? t('common', 'loading') : editingProduct ? t('common', 'edit') : t('common', 'add')}
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
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t('common', 'delete')}?</h3>
              <p className="text-slate-500 text-sm mb-6">
                {t('messages', 'deleteConfirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  {t('common', 'cancel')}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  {t('common', 'delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
