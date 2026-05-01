'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Building2, CreditCard, Package, Users, Store, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const STEPS = [
  { key: 'welcome', icon: Store, titleEn: 'Welcome', titleSw: 'Karibu!' },
  { key: 'branch', icon: Building2, titleEn: 'First Branch', titleSw: 'Tawi la Kwanza' },
  { key: 'payments', icon: CreditCard, titleEn: 'Payment Methods', titleSw: 'Njia za Malipo' },
  { key: 'categories', icon: Package, titleEn: 'Product Categories', titleSw: 'Aina za Bidhaa' },
  { key: 'products', icon: Package, titleEn: 'First Products', titleSw: 'Bidhaa za Kwanza' },
  { key: 'users', icon: Users, titleEn: 'Staff Users', titleSw: 'Mtumiaji' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { language, t } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [businessData, setBusinessData] = useState({
    businessName: '',
    currency: 'TZS',
    timezone: 'Africa/Nairobi',
  });

  const [branchData, setBranchData] = useState({
    name: '',
    location: '',
    manager: '',
  });

  const [payments, setPayments] = useState([
    { id: 'cash', nameEn: 'Cash', nameSw: 'Fedha', enabled: true, hasReference: false },
    { id: 'mpesa', nameEn: 'M-Pesa', nameSw: 'M-Pesa', enabled: true, hasReference: false },
    { id: 'card', nameEn: 'Card', nameSw: 'Kadi', enabled: true, hasReference: false },
    { id: 'credit', nameEn: 'Credit', nameSw: 'Mikopo', enabled: false, hasReference: false },
  ]);

  const [categories, setCategories] = useState<string[]>(['General']);
  const [newCategory, setNewCategory] = useState('');

  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
  });

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (completed && showConfetti) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [completed, showConfetti, router]);

  const isSwahili = language === 'sw';

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: businessData,
          branch: branchData,
          payments: payments.filter(p => p.enabled),
          categories,
          product: productData,
          user: userData,
        }),
      });

      if (res.ok) {
        setShowConfetti(true);
        setCompleted(true);
      }
    } catch (err) {
      console.error('Onboarding error:', err);
    }
  };

  const togglePayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles className={`w-6 h-6 ${['text-yellow-400', 'text-pink-400', 'text-indigo-400', 'text-green-400'][Math.floor(Math.random() * 4)]}`} />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{step.titleSw}</h1>
          <p className="text-slate-500">{step.titleEn}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>{isSwahili ? 'Hatua' : 'Step'} {currentStep + 1} {isSwahili ? 'ya' : 'of'} {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="min-h-[300px]">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Jina la Biashara' : 'Business Name'}
                  </label>
                  <input
                    type="text"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                    placeholder={isSwahili ? 'K.m. Duka Janja' : 'e.g. Duka Janja'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {isSwahili ? 'Sarafu' : 'Currency'}
                    </label>
                    <select
                      value={businessData.currency}
                      onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="TZS">TSh - Tanzania</option>
                      <option value="USD">USD - Dollars</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {isSwahili ? 'Saa Zone' : 'Timezone'}
                    </label>
                    <select
                      value={businessData.timezone}
                      onChange={(e) => setBusinessData({ ...businessData, timezone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Africa/Nairobi">East Africa (EAT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Jina la Tawi' : 'Branch Name'}
                  </label>
                  <input
                    type="text"
                    value={branchData.name}
                    onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                    placeholder={isSwahili ? 'K.m. Tawi Kuu' : 'e.g. Main Branch'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Mahali' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={branchData.location}
                    onChange={(e) => setBranchData({ ...branchData, location: e.target.value })}
                    placeholder={isSwahili ? 'K.m. Dar es Salaam' : 'e.g. Dar es Salaam'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Meneja' : 'Manager'}
                  </label>
                  <input
                    type="text"
                    value={branchData.manager}
                    onChange={(e) => setBranchData({ ...branchData, manager: e.target.value })}
                    placeholder={isSwahili ? 'Jina la meneja' : 'Manager name'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">
                  {isSwahili ? 'Washa njia za malipo utakazozitumia:' : 'Enable payment methods you will use:'}
                </p>
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      payment.enabled ? 'border-primary bg-primary/5' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={`w-5 h-5 ${payment.enabled ? 'text-primary' : 'text-slate-300'}`} />
                      <div>
                        <p className="font-medium">{isSwahili ? payment.nameSw : payment.nameEn}</p>
                        <p className="text-xs text-slate-400">{payment.id.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePayment(payment.id)}
                      className={`w-12 h-7 rounded-full transition-all ${
                        payment.enabled ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                          payment.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  {isSwahili ? 'Ongeza aina za bidhaa:' : 'Add product categories:'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    placeholder={isSwahili ? 'K.m. Vifuitasha' : 'e.g. Groceries'}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90"
                  >
                    {isSwahili ? 'Ongeza' : 'Add'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {cat}
                      <button onClick={() => removeCategory(cat)} className="hover:text-primary/70">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  {isSwahili ? 'Ongeza bidhaa ya kwanza (hii ni hiari):' : 'Add your first product (this is optional):'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Jina la Bidhaa' : 'Product Name'}
                  </label>
                  <input
                    type="text"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    placeholder={isSwahili ? 'K.m. Sukari 1kg' : 'e.g. Sugar 1kg'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
                    <input
                      type="text"
                      value={productData.sku}
                      onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                      placeholder="PROD-0001"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {isSwahili ? 'Bei' : 'Price'}
                    </label>
                    <input
                      type="number"
                      value={productData.price}
                      onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {isSwahili ? 'Gharama' : 'Cost'}
                    </label>
                    <input
                      type="number"
                      value={productData.cost}
                      onChange={(e) => setProductData({ ...productData, cost: e.target.value })}
                      placeholder="500"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {isSwahili ? 'Hesabu' : 'Stock'}
                    </label>
                    <input
                      type="number"
                      value={productData.stock}
                      onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                      placeholder="10"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  {isSwahili ? 'Unda akaunti ya kwanza ya mfanyakazi:' : 'Create your first staff account:'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Jina' : 'Name'}
                  </label>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    placeholder={isSwahili ? 'Jina kamili' : 'Full name'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isSwahili ? 'Nenosiri' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              {isSwahili ? 'Rudi' : 'Back'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-slate-500 hover:text-slate-700"
              >
                {isSwahili ? 'RUka' : 'Skip'}
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                >
                  {isSwahili ? 'Endelea' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700"
                >
                  <Check className="w-4 h-4" />
                  {isSwahili ? 'Maliza' : 'Complete'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'bg-primary w-6' : i < currentStep ? 'bg-primary/50' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}