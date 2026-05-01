'use client';

import { useEffect, useState } from 'react';
import { Package, Search, Plus, Check, X, Download, Printer, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  category: string | null;
  cost: number;
}

interface CountItem {
  productId: string;
  productName: string;
  sku: string;
  systemQty: number;
  actualQty: number;
  variance: number;
}

const STOCK_STATUS = {
  all: 'All Products',
  low: 'Low Stock',
  normal: 'Normal Stock',
};

export default function StockCountPage() {
  const { currency } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setCountItems(data.map((p: Product) => ({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          systemQty: p.stock,
          actualQty: p.stock,
          variance: 0,
        })));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateActualQty = (productId: string, qty: number) => {
    setCountItems(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, actualQty: qty, variance: qty - item.systemQty }
          : item
      )
    );
  };

  const reviewItems = countItems.filter(item => item.variance !== 0);
  const totalVariance = reviewItems.reduce((sum, item) => sum + item.variance * (products.find(p => p.id === item.productId)?.cost || 0), 0);

  const handlePrint = () => {
    const rows = [['SKU', 'Product', 'System Qty', 'Actual Qty', 'Variance']];
    filteredProducts.forEach(p => {
      const item = countItems.find(c => c.productId === p.id);
      rows.push([p.sku, p.name, String(p.stock), String(item?.actualQty || ''), String(item?.variance || '')]);
    });
    
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-count-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePost = async () => {
    setSubmitting(true);
    try {
      for (const item of reviewItems) {
        if (item.variance !== 0) {
          await fetch(`/api/products/${item.productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              newQty: item.actualQty,
              reason: 'count',
              notes: `Stock count adjustment`,
            }),
          });
        }
      }
      setShowReview(false);
      fetchProducts();
    } catch (err) {
      console.error('Error posting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Stock Count</h1>
              <p className="text-xs text-slate-500">Count and reconcile inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print Sheet
            </button>
            {reviewItems.length > 0 && (
              <button
                onClick={() => setShowReview(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Review ({reviewItems.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c || ''}>{c}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          >
            {Object.entries(STOCK_STATUS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">System Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Actual Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const item = countItems.find(c => c.productId === product.id);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">{product.name}</td>
                      <td className="px-4 py-3 text-center font-medium">{item?.systemQty}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item?.actualQty ?? 0}
                          onChange={(e) => updateActualQty(product.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${
                          (item?.variance || 0) > 0 ? 'text-green-600' :
                          (item?.variance || 0) < 0 ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {item?.variance || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Review Stock Count</h3>
              <button onClick={() => setShowReview(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-amber-700">
                  {reviewItems.length} items with variance | Total: {formatCurrency(totalVariance, currency)}
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs">SKU</th>
                    <th className="px-3 py-2 text-left text-xs">Product</th>
                    <th className="px-3 py-2 text-center text-xs">System</th>
                    <th className="px-3 py-2 text-center text-xs">Actual</th>
                    <th className="px-3 py-2 text-center text-xs">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewItems.map(item => (
                    <tr key={item.productId} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-sm font-mono">{item.sku}</td>
                      <td className="px-3 py-2 text-sm">{item.productName}</td>
                      <td className="px-3 py-2 text-center text-sm">{item.systemQty}</td>
                      <td className="px-3 py-2 text-center text-sm font-medium">{item.actualQty}</td>
                      <td className={`px-3 py-2 text-center font-medium ${
                        item.variance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Approve & Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}