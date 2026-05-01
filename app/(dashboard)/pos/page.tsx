'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore, Branch, useCartStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import {
<<<<<<< HEAD
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
=======
  Search, Package, Plus, Minus, X, ShoppingCart, User, Printer, Mail,
  Banknote, CreditCard, Smartphone, Gift, Receipt, Settings, Clock,
  Trash2, Tag, DollarSign, Users
>>>>>>> origin/main
} from 'lucide-react';

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
  unit: string;
  taxRate: number;
  isActive: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  nameSw: string | null;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  taxRate: number;
  discount: number;
  notes: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  nameSw: string | null;
  code: string;
  hasReference: boolean;
  referenceLabel: string | null;
  isEnabled: boolean;
  sortOrder: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creditBalance: number;
  creditLimit: number;
}

interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  invoiceHeader: string | null;
  invoiceFooter: string | null;
}

interface SaleRecord {
  id: string;
  saleNumber: string;
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentRef: string | null;
  customerName: string | null;
  createdAt: string;
}

const LABELS = {
  en: {
    search: 'Search products by name, SKU, or barcode...',
    cart: 'Cart',
    subtotal: 'Subtotal',
    tax: 'Tax',
    discount: 'Discount',
    total: 'Total',
    change: 'Change',
    cash: 'Cash',
    card: 'Card',
    mobile: 'Mobile Money',
    credit: 'Credit',
    completeSale: 'Complete Sale',
    newSale: 'New Sale',
    print: 'Print',
    email: 'Email',
    noProducts: 'No products found',
    outOfStock: 'Out of stock',
    qty: 'Qty',
    addNote: 'Add note',
    itemDiscount: 'Item Discount',
    orderDiscount: 'Order Discount',
    splitPayment: 'Split Payment',
    addMethod: '+ Add Another',
    customer: 'Customer',
    selectCustomer: 'Select customer (optional)',
    creditBalance: 'Credit Balance',
    creditLimit: 'Credit Limit',
    reference: 'Reference No',
    amountTendered: 'Amount Tendered',
    balanceDue: 'Balance Due',
  },
  sw: {
    search: 'Tafuta bidhaa kwa jina, SKU...',
    cart: 'Kiwango',
    subtotal: 'Jumla',
    tax: 'Taxi',
    discount: 'Punguzo',
    total: 'Jumla Kamili',
    change: 'Ruzuku',
    cash: 'Pesa Taslimu',
    card: 'Kadi',
    mobile: 'Simu',
    credit: 'Mikopo',
    completeSale: 'Maliza Mauzo',
    newSale: 'Mauzo Mpya',
    print: 'Chapisha',
    email: 'Email',
    noProducts: 'Hakuna bidhaa',
    outOfStock: 'Haijawezi kununuliwa',
    qty: 'Idadi',
    addNote: 'Ongeza maelezo',
    itemDiscount: 'Punguzi Bidhaa',
    orderDiscount: 'Punguzi Order',
    splitPayment: 'Gawanya Malipo',
    addMethod: '+ Ongeza Nyingine',
    customer: 'Mteja',
    selectCustomer: 'Chagua mteja (hiari)',
    creditBalance: 'Salio Ya Mikopo',
    creditLimit: 'K Limit Ya Mikopo',
    reference: 'Nambari Ya Marej',
    amountTendered: 'Kiasi Alichotoa',
    balanceDue: 'Baki Ya Kulipa',
  },
};

export default function POSPage() {
  const { currency, branches, currentBranch, user, t, language } = useAppStore();
  const { items: cartItems, addItem, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [payments, setPayments] = useState<{ method: string; amount: number; ref: string }[]>([]);
  const [showSplit, setShowSplit] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState(0);
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
<<<<<<< HEAD
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
=======
  
  const printRef = useRef<HTMLDivElement>(null);
  const labels = LABELS[language as keyof typeof LABELS] || LABELS.en;
>>>>>>> origin/main

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, methodsRes, customersRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/payment-methods'),
        fetch('/api/customers'),
        fetch('/api/settings'),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const activeProducts = data.filter((p: Product) => p.isActive !== false);
        setProducts(activeProducts);
        const cats = ['All', ...new Set(activeProducts.map((p: Product) => p.category).filter(Boolean))] as string[];
        setCategories(cats);
      }
      if (methodsRes.ok) {
        const data = await methodsRes.json();
        const enabled = data.filter((m: PaymentMethod) => m.isEnabled !== false);
        setPaymentMethods(enabled.sort((a: PaymentMethod, b: PaymentMethod) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      }
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (settingsRes.ok) setBusinessSettings(await settingsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameSw?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.stock > 0;
  });

  const subtotal = getSubtotal();
  const totalDiscount = orderDiscount + cartItems.reduce((sum, item) => sum + item.discount * item.quantity, 0);
  const totalTax = cartItems.reduce((sum, item) => {
    const itemSubtotal = item.price * item.quantity - item.discount * item.quantity;
    return sum + (itemSubtotal * item.taxRate / 100);
  }, 0);
  const total = subtotal - totalDiscount + totalTax;
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + (payments.length === 0 ? tenderedAmount : 0);
  const balanceDue = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

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
    if (product.stock <= 0) return;
    const cartItem: CartItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      nameSw: product.nameSw,
      sku: product.sku,
      price: product.price,
      quantity: 1,
      stock: product.stock,
      taxRate: product.taxRate,
      discount: 0,
      notes: '',
    };
    addItem(cartItem as any);
  }, [addItem]);

  const handleUpdateItemDiscount = (id: string, discount: number) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      updateQuantity(id, item.quantity, discount);
    }
  };

  const handleAddPayment = () => {
    if (!selectedMethod || tenderedAmount <= 0) return;
    const method = paymentMethods.find(m => m.code === selectedMethod);
    setPayments([...payments, { method: selectedMethod, amount: tenderedAmount, ref: '' }]);
    setTenderedAmount(0);
    setSelectedMethod('');
  };

  const getMethodLabel = (code: string) => {
    const method = paymentMethods.find(m => m.code === code);
    if (!method) return code;
    return language === 'sw' && method.nameSw ? method.nameSw : method.name;
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return;
    if (totalPaid < total) {
      setMessage({ type: 'error', text: 'Insufficient payment' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const saleItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity - item.discount * item.quantity,
      }));

      const paymentData = payments.length > 0 ? payments : [
        { method: selectedMethod, amount: totalPaid, ref: '' }
      ];

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: saleItems,
          paymentMethod: paymentData[0].method,
          paymentRef: paymentData[0].ref || null,
          paidAmount: totalPaid,
          change,
          discount: totalDiscount,
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Sale failed');
      }

      const sale = await res.json();
      setLastSale(sale);
      setShowReceipt(true);
      clearCart();
      setPayments([]);
      setSelectedMethod('');
      setTenderedAmount(0);
      setSelectedCustomer(null);
      setOrderDiscount(0);
      
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Sale failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
<<<<<<< HEAD
    <div className="flex h-screen bg-surface overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2 h-14 bg-slate-100 border-b border-slate-200">
          <div className="hidden md:flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-lg">{t('pos', 'title')}</h1>
=======
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="font-bold text-lg text-slate-800">POS</h1>
                <p className="text-xs text-slate-500">{currentBranch?.name || 'Main'}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="text-sm">
              <p className="text-slate-600">Cashier: <span className="font-medium">{user?.name || 'User'}</span></p>
>>>>>>> origin/main
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.search}
                className="w-72 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
<<<<<<< HEAD
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button className="p-1.5 rounded-full hover:bg-slate-200">
              <span className="text-slate-600 text-xs">Notifications</span>
            </button>
=======
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
>>>>>>> origin/main
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-8 w-8"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-12 h-12 mb-3" />
                <p className="text-base font-medium">{labels.noProducts}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      product.stock <= 0 
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        product.stock === 0 ? 'bg-red-500' :
                        product.stock <= product.lowStockThreshold ? 'bg-amber-500' : 'bg-green-500'
                      }`}></span>
                    </div>
                    <h3 className="font-medium text-sm text-slate-800 truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">{product.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600">{formatCurrency(product.price, currency)}</span>
                      <span className={`text-xs ${product.stock <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
<<<<<<< HEAD
          
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
=======
        </div>
      </div>

      {/* Right Panel - Cart & Payment */}
      <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-700">{labels.cart}</h3>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <ShoppingCart className="w-12 h-12 mb-3" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
>>>>>>> origin/main
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
<<<<<<< HEAD
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
=======
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-100 rounded">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-2 font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-white rounded disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(item.price * item.quantity, currency)}</p>
>>>>>>> origin/main
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Selection */}
        <div className="px-4 py-2 border-t border-slate-200">
          <button
            onClick={() => setShowCustomerSelect(!showCustomerSelect)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <Users className="w-4 h-4" />
            {selectedCustomer ? selectedCustomer.name : labels.selectCustomer}
          </button>
          {selectedCustomer && (
            <div className="mt-1 text-xs text-amber-600">
              {labels.creditBalance}: {formatCurrency(selectedCustomer.creditBalance, currency)}
            </div>
          )}
        </div>

        {/* Customer Select Modal */}
        {showCustomerSelect && (
          <div className="px-4 pb-2 border-t border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm"
              />
            </div>
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setShowCustomerSelect(false);
                    setCustomerSearch('');
                  }}
                  className="w-full px-2 py-1 text-left text-sm hover:bg-slate-100 rounded"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-slate-500 ml-2">
                    {c.creditBalance > 0 && `(Credit: ${formatCurrency(c.creditBalance, currency)})`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{labels.subtotal}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{labels.discount}</span>
                <span>-{formatCurrency(totalDiscount, currency)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">{labels.tax}</span>
                <span>{formatCurrency(totalTax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
              <span>{labels.total}</span>
              <span className="text-blue-600">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {paymentMethods.slice(0, 6).map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.code)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedMethod === method.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {method.code === 'cash' && <Banknote className="w-5 h-5 block mx-auto text-green-600" />}
                {method.code === 'card' && <CreditCard className="w-5 h-5 block mx-auto text-blue-600" />}
                {method.code === 'mobile' && <Smartphone className="w-5 h-5 block mx-auto text-purple-600" />}
                {method.code === 'credit' && <Gift className="w-5 h-5 block mx-auto text-amber-600" />}
                <span className="text-xs font-bold block text-center mt-1">
                  {language === 'sw' && method.nameSw ? method.nameSw : method.name}
                </span>
              </button>
            ))}
          </div>

          {selectedMethod && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">{labels.amountTendered}</label>
                <input
                  type="number"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                />
              </div>
              {paymentMethods.find(m => m.code === selectedMethod)?.hasReference && (
                <div>
                  <label className="text-xs text-slate-500">
                    {paymentMethods.find(m => m.code === selectedMethod)?.referenceLabel || labels.reference}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Enter reference..."
                  />
                </div>
              )}
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-3 space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                  <span>{getMethodLabel(p.method)}</span>
                  <span>{formatCurrency(p.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSplit(!showSplit)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            {labels.splitPayment}
          </button>
        </div>

        {/* Payment Summary */}
        <div className="px-4 py-3 border-t border-slate-200">
          {balanceDue > 0 && (
            <div className="flex justify-between text-amber-600 mb-2">
              <span>{labels.balanceDue}</span>
              <span className="font-bold">{formatCurrency(balanceDue, currency)}</span>
            </div>
          )}
          {change > 0 && (
            <div className="flex justify-between text-green-600 font-bold text-lg">
              <span>{labels.change}</span>
              <span>{formatCurrency(change, currency)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-slate-200">
          {message && (
            <div className={`p-3 rounded-lg text-sm mb-3 ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={clearCart}
              className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-300"
            >
              {language === 'sw' ? 'Futa' : 'Clear'}
            </button>
            <button
              onClick={handleCompleteSale}
              disabled={cartItems.length === 0 || !selectedMethod || balanceDue > 0 || submitting}
              className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : labels.completeSale}
            </button>
          </div>
        </div>
      </aside>

<<<<<<< HEAD
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
=======
      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" ref={printRef}>
            <div className="p-6" id="receipt-content">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-xl font-bold">{businessSettings?.businessName || 'DUKA JANJA'}</h2>
                {businessSettings?.businessAddress && (
                  <p className="text-xs text-slate-500">{businessSettings.businessAddress}</p>
                )}
                {businessSettings?.businessPhone && (
                  <p className="text-xs text-slate-500">{businessSettings.businessPhone}</p>
                )}
              </div>

              <div className="flex justify-between mb-4">
                <div>
                  <p className="font-bold">Receipt: {lastSale.saleNumber}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(lastSale.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Cashier: {user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500">{currentBranch?.name || 'Main'}</p>
                </div>
              </div>

              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-bold text-slate-500">Item</th>
                    <th className="text-center py-2 text-xs font-bold text-slate-500">Qty</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 text-sm">{item.productName}</td>
                      <td className="py-2 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 text-sm text-right">{formatCurrency(item.totalPrice, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{labels.subtotal}</span>
                  <span>{formatCurrency(lastSale.subtotal, currency)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{labels.discount}</span>
                    <span>-{formatCurrency(lastSale.discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>{labels.tax}</span>
                  <span>{formatCurrency(lastSale.tax, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2">
                  <span>{labels.total}</span>
                  <span className="text-blue-600">{formatCurrency(lastSale.total, currency)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Payment:</span> {getMethodLabel(lastSale.paymentMethod)}
                </p>
                {lastSale.paymentRef && (
                  <p className="text-xs text-slate-500">Ref: {lastSale.paymentRef}</p>
                )}
              </div>

              {businessSettings?.invoiceFooter && (
                <p className="mt-4 text-xs text-slate-500 text-center">
                  {businessSettings.invoiceFooter}
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {labels.print}
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                {labels.newSale}
>>>>>>> origin/main
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}