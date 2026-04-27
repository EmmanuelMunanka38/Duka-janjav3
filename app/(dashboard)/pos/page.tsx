'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCartStore, useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import {
  Search,
  Package,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
  ChevronLeft,
  Printer,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string | null;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function POSPage() {
  const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { currency, t } = useAppStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptDate] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }));
  const [receiptTime] = useState(() => new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }));
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data: Product[] = await res.json();
          setProducts(data);
          const cats = ['All', ...new Set(data.map(p => p.category).filter(Boolean))] as string[];
          setCategories(cats);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.stock > 0;
  });

  const subtotal = getSubtotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const change = paidAmount - total;

  const handlePrintReceipt = useCallback(() => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - DUKA JANJA</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            h2 { text-align: center; margin: 0 0 5px 0; }
            p { margin: 5px 0; font-size: 12px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; font-size: 12px; }
            .item { font-size: 11px; margin: 3px 0; }
          </style>
        </head>
        <body>
          <h2>DUKA JANJA</h2>
          <p class="center">${receiptDate} ${receiptTime}</p>
          <div class="line"></div>
          ${cartItems.map((item, i) => `
            <div class="item">
              <span>${i + 1}. ${item.name} x${item.quantity}</span>
              <span>${formatCurrency(item.price * item.quantity, currency)}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="row"><span>Subtotal:</span><span>${formatCurrency(subtotal, currency)}</span></div>
          <div class="row"><span>Tax (8%):</span><span>${formatCurrency(tax, currency)}</span></div>
          <div class="row"><strong><span>Total:</span><span>${formatCurrency(total, currency)}</span></strong></div>
          <div class="row"><span>Paid (${selectedPayment}):</span><span>${formatCurrency(paidAmount, currency)}</span></div>
          <div class="row"><span>Change:</span><span>${formatCurrency(change, currency)}</span></div>
          <div class="line"></div>
          <p class="center">Thank you for your business!</p>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }, [cartItems, subtotal, tax, total, paidAmount, change, selectedPayment, receiptDate, receiptTime, currency]);

  const handleAddToCart = useCallback((product: Product) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: 1,
      stock: product.stock,
    };
    addItem(cartItem);
  }, [addItem]);

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !selectedPayment) {
      setMessage({ type: 'error', text: t('pos', 'selectProduct') });
      return;
    }

    if (paidAmount < total) {
      setMessage({ type: 'error', text: t('messages', 'error') });
      return;
    }

    setCheckoutLoading(true);
    setMessage(null);

    try {
      const saleItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      }));

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: saleItems,
          paymentMethod: selectedPayment,
          paidAmount,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(t('messages', 'saveError'));
      }

      setMessage({ type: 'success', text: t('messages', 'saleComplete') });
      clearCart();
      setPaidAmount(0);
      setSelectedPayment(null);

      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        setProducts(await productsRes.json());
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('messages', 'saveError') });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2 h-14 bg-slate-100 border-b border-slate-200">
          <div className="hidden md:flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-lg">{t('pos', 'title')}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pos', 'scanBarcode')}
                className="w-64 pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button className="p-1.5 rounded-full hover:bg-slate-200">
              <span className="text-slate-600 text-xs">Notifications</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-12 h-12 mb-3 text-slate-400" />
                <p className="text-base font-medium">{t('inventory', 'noProducts')}</p>
                <p className="text-sm">{t('inventory', 'searchProducts')}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-sm text-slate-800 truncate">{product.name}</h3>
<p className="text-xs text-slate-400 mb-2">{t('inventory', 'sku')}: {product.sku}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{formatCurrency(product.price, currency)}</span>
                        <span className={`text-xs ${product.stock <= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                          {product.stock} {t('dashboard', 'left')}
                        </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className='hidden md:flex md:p-4'>
          {cartItems.length > 0 && (
            <div className="w-80 border-l border-slate-200  overflow-y-auto bg-white">
              <h3 className="text-sm font-bold text-slate-500 mb-3 ml-5">{t('pos', 'cart')}</h3>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.price, currency)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded border border-slate-200">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 rounded-l"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-2 text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 rounded-r"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </main>

      <aside className="hidden md:flex md:w-[340px] bg-surface-container-low flex-col border-l border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-500 mb-3">{t('pos', 'paymentMethod')}</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'cash', Icon: Banknote, labelKey: 'cash' },
            { id: 'card', Icon: CreditCard, labelKey: 'card' },
            { id: 'mobile', Icon: Smartphone, labelKey: 'mobile' },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`p-3 flex rounded-xl border-2 transition-all ${
                selectedPayment === method.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-white'
              }`}
            >
              <method.Icon className="w-5 h-5 block mx-auto" />
              <span className="text-xs font-bold block text-center mt-1">
                {t('pos', method.labelKey)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col mb-4">
          <div className="px-3 py-2 bg-slate-800 text-white flex items-center justify-between">
            <div className="text-center flex-1">
              <h3 className="font-bold text-sm">DUKA JANJA</h3>
              <p className="text-xs text-slate-400">{receiptDate} {receiptTime}</p>
            </div>
            {cartItems.length > 0 && (
              <button onClick={handlePrintReceipt} className="p-1 hover:bg-slate-700 rounded" title="Print Receipt">
                <Printer className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <Receipt className="w-10 h-10 mb-2 text-slate-400" />
                <p className="text-sm">{t('pos', 'emptyCart')}</p>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 border-b border-dashed border-slate-300 pb-1 mb-1">
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {cartItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between py-1">
                    <div>
                      <span className="text-slate-400">{index + 1}.</span>
                      <span className="ml-1">{item.name}</span>
                      <span className="text-slate-500 ml-1">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-400 text-center mb-1">────────────</div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pos', 'subtotal')}</span>
                  <span className="font-bold">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('common', 'tax')} (8%)</span>
                  <span className="font-bold">{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-dashed border-slate-300 mt-1">
                  <span>{t('pos', 'total')}</span>
                  <span className="text-indigo-700">{formatCurrency(total, currency)}</span>
                </div>
                <div className="mt-2">
                  <label className="text-slate-600 text-xs">{t('pos', 'cash')}</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-1"
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                  />
                </div>
                {change >= 0 && paidAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>{t('pos', 'change')}</span>
                    <span>{formatCurrency(change, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={clearCart}
            className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-300"
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || !selectedPayment || paidAmount < total || checkoutLoading}
            className="flex-[2] py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 hover:opacity-90"
          >
            {checkoutLoading ? t('common', 'loading') : t('pos', 'completeSale')}
          </button>
        </div>
      </aside>

      {cartItems.length > 0 && (
        <button
          onClick={() => setShowMobileCart(!showMobileCart)}
          className="md:hidden fixed bottom-20 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-bold">{cartItems.length}</span>
        </button>
      )}

      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-40 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('pos', 'cart')}</h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintReceipt} className="p-2" title="Print Receipt">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowMobileCart(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.price, currency)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded border border-slate-200">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-100 rounded-l">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-100 rounded-r" disabled={item.quantity >= item.stock}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col mb-4">
              <div className="px-3 py-2 bg-slate-800 text-white text-center">
                <h3 className="font-bold text-sm">DUKA JANJA</h3>
                <p className="text-xs text-slate-400">{receiptDate} {receiptTime}</p>
              </div>
              <div className="p-3">
                <div className="space-y-1 text-xs">
                  {cartItems.map((item, index) => (
                    <div key={item.id} className="flex justify-between py-1">
                      <div>
                        <span className="text-slate-400">{index + 1}.</span>
                        <span className="ml-1">{item.name}</span>
                        <span className="text-slate-500 ml-1">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-400 text-center mb-1">────────────</div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('pos', 'subtotal')}</span>
                    <span className="font-bold">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('common', 'tax')} (8%)</span>
                    <span className="font-bold">{formatCurrency(tax, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-dashed border-slate-300 mt-1">
                    <span>{t('pos', 'total')}</span>
                    <span className="text-indigo-700">{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{ id: 'cash', Icon: Banknote, labelKey: 'cash' }, { id: 'card', Icon: CreditCard, labelKey: 'card' }, { id: 'mobile', Icon: Smartphone, labelKey: 'mobile' }].map((method) => (
                <button key={method.id} onClick={() => setSelectedPayment(method.id)} className={`p-3 rounded-xl border-2 transition-all ${selectedPayment === method.id ? 'border-primary bg-primary/10' : 'border-transparent bg-white'}`}>
                  <method.Icon className="w-5 h-5 block mx-auto" />
                  <span className="text-xs font-bold block text-center mt-1">{t('pos', method.labelKey)}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={clearCart} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-300">{t('common', 'cancel')}</button>
              <button onClick={handleCheckout} disabled={!selectedPayment || paidAmount < total || checkoutLoading} className="flex-[2] py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold text-sm shadow-lg disabled:opacity-50 hover:opacity-90">
                {checkoutLoading ? t('common', 'loading') : t('pos', 'completeSale')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
