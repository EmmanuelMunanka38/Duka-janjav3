'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Search, RefreshCw, Undo2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost: number;
}

export default function PurchasesReturnsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { currency } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
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

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Undo2 className="w-6 h-6 text-red-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Purchase Returns</h1>
              <p className="text-xs text-slate-500">Process returns to suppliers</p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
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
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Products</p>
                <p className="text-xl font-bold text-slate-800">{products.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Stock</p>
                <p className="text-xl font-bold text-slate-800">{totalStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Inventory Value</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(totalValue, currency)}</p>
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
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
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
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
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
                  filteredProducts.slice(0, 30).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm text-slate-800">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product.sku}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-800">{product.stock}</td>
                      <td className="px-4 py-3 text-right font-medium text-sm text-slate-800">
                        {formatCurrency(product.cost, currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.stock > 0 && (
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowModal(true);
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Process Return to Supplier</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Product</p>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(selectedProduct.cost, currency)} per unit</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="">Select reason</option>
                  <option value="defective">Defective Product</option>
                  <option value="expired">Expired Product</option>
                  <option value="wrong_item">Wrong Item Received</option>
                  <option value="overstock">Overstock</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {}}
                  disabled={!reason || processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}