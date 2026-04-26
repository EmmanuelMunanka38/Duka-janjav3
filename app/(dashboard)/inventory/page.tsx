'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Package, Search, Plus, Edit, Trash2, X, Eye, Download, Printer, 
  AlertTriangle, DollarSign, ArrowUpDown, RefreshCw, Tag, QrCode
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  nameSw: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  category: string | null;
  categoryId: string | null;
  branchId: string | null;
  supplier: { id: string; name: string } | null;
  unit: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  stockHistory?: StockHistory[];
}

interface ProductCategory {
  id: string;
  name: string;
  prefix: string | null;
}

interface StockHistory {
  id: string;
  type: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
}

const STOCK_STATUS = {
  all: 'All',
  out: 'Out of Stock',
  low: 'Low Stock',
  normal: 'Normal',
  high: 'High',
};

const REASON_LABELS = [
  { value: 'count', label: 'Stock Count', labelSw: 'Kuhesabu' },
  { value: 'damage', label: 'Damage', labelSw: 'Uharibifu' },
  { value: 'theft', label: 'Theft', labelSw: 'Wizi' },
  { value: 'error', label: 'Error', labelSw: 'Kosa' },
  { value: 'other', label: 'Other', labelSw: 'Nyingine' },
];

export default function InventoryPage() {
  const { currency, branches, currentBranch } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '', nameSw: '', sku: '', barcode: '',
    price: 0, cost: 0, stock: 0, lowStockThreshold: 5,
    categoryId: '', supplierId: '', unit: 'pc', taxRate: 0,
  });

  const [adjustData, setAdjustData] = useState({ newQty: 0, reason: 'count', notes: '' });
  const [transferData, setTransferData] = useState({
    toBranchId: '', quantity: 1, notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [categoryFilter, branchFilter, stockFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter);

      const [productsRes, suppliersRes] = await Promise.all([
        fetch(`/api/products?${params.toString()}`),
        fetch('/api/suppliers'),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories.map(c => ({ id: c as string, name: c as string, prefix: (c as string).slice(0, 4).toUpperCase() })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (p.isActive || !stockFilter);
  });

  const getStockStatus = (p: Product) => {
    if (p.stock === 0) return 'out';
    if (p.stock <= p.lowStockThreshold) return 'low';
    return 'normal';
  };

  const getStockColor = (p: Product) => {
    const status = getStockStatus(p);
    if (status === 'out') return 'bg-red-100 text-red-700';
    if (status === 'low') return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const margin = (p: Product) => p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(1) : 0;

  const generateSKU = async () => {
    const cat = categories.find(c => c.id === formData.categoryId);
    const prefix = cat?.prefix || 'PROD';
    const count = products.filter(p => p.sku.startsWith(prefix)).length;
    const sku = `${prefix}-${String(count + 1).padStart(4, '0')}`;
    setFormData({ ...formData, sku });
  };

  const generateBarcode = () => {
    const barcode = `2${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setFormData({ ...formData, barcode });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '', nameSw: '', sku: '', barcode: '',
      price: 0, cost: 0, stock: 0, lowStockThreshold: 5,
      categoryId: '', supplierId: '', unit: 'pc', taxRate: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameSw: product.nameSw || '',
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      categoryId: product.categoryId || '',
      supplierId: product.supplier?.id || '',
      unit: product.unit,
      taxRate: product.taxRate,
    });
    setShowModal(true);
  };

  const openDetailModal = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (res.ok) {
        setSelectedProduct(await res.json());
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    }
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustData({ newQty: product.stock, reason: 'count', notes: '' });
    setShowAdjustModal(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}` 
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustData),
      });

      if (res.ok) {
        setShowAdjustModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error adjusting:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/products/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          fromBranchId: currentBranch?.id || 'main',
          toBranchId: transferData.toBranchId,
          quantity: transferData.quantity,
          notes: transferData.notes,
        }),
      });

      if (res.ok) {
        setShowTransferModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error transferring:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error deactivating:', err);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Deactivate ${selectedProducts.size} products?`)) return;
    try {
      await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedProducts), isActive: false }),
      });
      setSelectedProducts(new Set());
      fetchData();
    } catch (err) {
      console.error('Error deactivating:', err);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleExport = () => {
    const headers = ['SKU', 'Name', 'Name (SW)', 'Category', 'Stock', 'Cost', 'Price', 'Margin %', 'Status'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.nameSw || '',
      p.category || '',
      p.stock,
      p.cost,
      p.price,
      margin(p),
      getStockStatus(p),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const lowStockCount = filteredProducts.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const outOfStockCount = filteredProducts.filter(p => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Inventory</h1>
              <p className="text-xs text-slate-500">Manage products and stock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Products</p>
            <p className="text-xl font-bold text-blue-600">{filteredProducts.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Stock Value</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalValue, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Low Stock</p>
            <p className="text-xl font-bold text-amber-600">{lowStockCount}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Out of Stock</p>
            <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {Object.entries(STOCK_STATUS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDeactivate}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
            >
              Deactivate ({selectedProducts.size})
            </button>
          )}
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
                    <th className="px-3 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500">SKU</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500">Product Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500">Category</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500">Stock</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">Cost</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">Price</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500">Margin</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500">Status</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className={`hover:bg-slate-50 ${!product.isActive ? 'bg-slate-50 opacity-50' : ''}`}>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-sm text-slate-600">{product.sku}</span>
                          {product.barcode && (
                            <span className="ml-2 text-xs text-slate-400">📱</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400" />
                            <div>
                              <p className="font-medium text-sm text-slate-800">{product.name}</p>
                              {product.nameSw && (
                                <p className="text-xs text-slate-500">{product.nameSw}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600">
                          {product.category || '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-bold ${getStockColor(product)}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(product.cost, currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-slate-800">
                          {formatCurrency(product.price, currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-600">
                          {margin(product)}%
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStockColor(product)}`}>
                            {getStockStatus(product) === 'out' ? 'Out' : getStockStatus(product) === 'low' ? 'Low' : 'OK'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetailModal(product)}
                              className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openAdjustModal(product)}
                              className="p-1.5 hover:bg-slate-100 rounded text-green-600"
                              title="Adjust Stock"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedProduct(product); setShowBarcodeModal(true); }}
                              className="p-1.5 hover:bg-slate-100 rounded text-purple-600"
                              title="Print Barcode"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
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

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Product Name (EN) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Jina (SW)</label>
                  <input
                    type="text"
                    value={formData.nameSw}
                    onChange={(e) => setFormData({ ...formData, nameSw: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">SKU</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Auto-generated"
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Barcode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="pc">Piece (pc)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Cost Price</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Selling Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tax Rate %</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
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
                  onClick={handleSave}
                  disabled={!formData.name || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Product Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  {selectedProduct.nameSw && (
                    <p className="text-slate-500">{selectedProduct.nameSw}</p>
                  )}
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStockColor(selectedProduct)}`}>
                  {getStockStatus(selectedProduct) === 'out' ? 'Out of Stock' : getStockStatus(selectedProduct) === 'low' ? 'Low Stock' : 'In Stock'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">SKU</p>
                  <p className="font-mono font-medium">{selectedProduct.sku}</p>
                </div>
                {selectedProduct.barcode && (
                  <div>
                    <p className="text-xs text-slate-500">Barcode</p>
                    <p className="font-mono font-medium">{selectedProduct.barcode}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p>{selectedProduct.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier</p>
                  <p>{selectedProduct.supplier?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current Stock</p>
                  <p className="font-bold text-lg">{selectedProduct.stock} {selectedProduct.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Low Stock Alert</p>
                  <p>{selectedProduct.lowStockThreshold}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cost Price</p>
                  <p>{formatCurrency(selectedProduct.cost, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Selling Price</p>
                  <p className="font-bold">{formatCurrency(selectedProduct.price, currency)}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-medium mb-2">Stock History</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedProduct.stockHistory?.length ? (
                    selectedProduct.stockHistory.map((h) => (
                      <div key={h.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                        <div>
                          <span className="font-medium">{h.type}</span>
                          {h.reason && <span className="text-slate-500 ml-2">- {h.reason}</span>}
                        </div>
                        <div className={`${h.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {h.quantity > 0 ? '+' : ''}{h.quantity} → {h.newQty}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No stock history</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => openEditModal(selectedProduct)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Edit Product
              </button>
              <button
                onClick={() => handleDeactivate(selectedProduct.id)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Adjust Stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Product</p>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  Current: {selectedProduct.stock} {selectedProduct.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">New Quantity</label>
                <input
                  type="number"
                  value={adjustData.newQty}
                  onChange={(e) => setAdjustData({ ...adjustData, newQty: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Reason</label>
                <select
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  {REASON_LABELS.map(r => (
                    <option key={r.value} value={r.value}>{r.label} ({r.labelSw})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={adjustData.newQty === selectedProduct.stock || submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Adjust Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {showBarcodeModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Print Barcode</h3>
              <button onClick={() => setShowBarcodeModal(false)} className="p-1 hover:bg-slate-100 rounded">✕</button>
            </div>
            <div className="p-6" ref={printRef}>
              <div className="border-2 border-black p-4 text-center">
                <p className="font-bold text-lg">{selectedProduct.name}</p>
                <p className="text-sm">{selectedProduct.sku}</p>
                <div className="my-4 text-4xl font-mono">{selectedProduct.barcode}</div>
                <p className="font-bold text-xl">{formatCurrency(selectedProduct.price, currency)}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setShowBarcodeModal(false)}
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