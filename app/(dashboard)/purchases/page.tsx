'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingCart, Package, Plus, Truck, Search, Pencil, Trash2, X, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitCost: z.number().positive(),
  })).min(1),
  paymentMethod: z.string().min(1),
  paidAmount: z.number().min(0),
});

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

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface PurchaseItem {
  productId: string;
  product: { name: string };
  quantity: number;
  unitCost: number;
  totalPrice: number;
}

interface Purchase {
  id: string;
  orderNumber: string;
  supplier: { name: string };
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function PurchasesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currency } = useAppStore();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      setPurchases([]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingOrders = purchases.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Purchases</h1>
              <p className="text-xs text-slate-500">Manage purchase orders and stock</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Purchase
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Purchases</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(totalPurchases, currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending Orders</p>
                <p className="text-xl font-bold text-slate-800">{pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Products</p>
                <p className="text-xl font-bold text-slate-800">{products.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products to purchase..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.slice(0, 20).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="font-medium text-sm text-slate-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.sku}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sm text-slate-800">
                        {formatCurrency(product.cost, currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          product.stock > 10 ? 'bg-green-100 text-green-700' :
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-500">
          {products.length > 0 && (
            <p>Showing {Math.min(20, filteredProducts.length)} of {products.length} products. Use search to find specific products.</p>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">New Purchase Order</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Supplier</label>
                <select
                  {...register('supplierId')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.supplierId && <p className="text-red-500 text-xs mt-1">Supplier is required</p>}
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}