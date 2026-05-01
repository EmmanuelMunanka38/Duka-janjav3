'use client';

import { useEffect, useState } from 'react';
import { Scale, Download, Printer, Building2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';
import TopNav from '@/components/layout/TopNav';

interface BalanceSheetData {
  currentAssets: { name: string; nameSw: string; amount: number }[];
  fixedAssets: { name: string; nameSw: string; amount: number }[];
  totalCurrentAssets: number;
  totalFixedAssets: number;
  currentLiabilities: { name: string; nameSw: string; amount: number }[];
  longTermLiabilities: { name: string; nameSw: string; amount: number }[];
  totalCurrentLiabilities: number;
  totalLongTermLiabilities: number;
  ownersEquity: { name: string; nameSw: string; amount: number }[];
  retainedEarnings: number;
  netIncome: number;
}

export default function BalanceSheetPage() {
  const { currency, t, branches } = useAppStore();
  const [data, setData] = useState<BalanceSheetData>({
    currentAssets: [],
    fixedAssets: [],
    totalCurrentAssets: 0,
    totalFixedAssets: 0,
    currentLiabilities: [],
    longTermLiabilities: [],
    totalCurrentLiabilities: 0,
    totalLongTermLiabilities: 0,
    ownersEquity: [],
    retainedEarnings: 0,
    netIncome: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [dateFilter, branchFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchId = branchFilter !== 'all' ? branchFilter : undefined;
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const [salesRes, expensesRes, productsRes] = await Promise.all([
        fetch(`/api/sales?${params.toString()}`),
        fetch(`/api/expenses?${params.toString()}`),
        fetch(`/api/products?${params.toString()}`),
      ]);

      let revenue = 0;
      let expenses = 0;
      let inventoryValue = 0;
      let accountsReceivable = 0;
      let accountsPayable = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        accountsReceivable = revenue * 0.1;
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        expenses = expensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        accountsPayable = expenses * 0.15;
      }

      if (productsRes.ok) {
        const products = await productsRes.json();
        inventoryValue = products.reduce((sum: number, p: { stock: number; cost: number }) => sum + p.stock * p.cost, 0);
      }

      const cash = revenue - accountsPayable - accountsReceivable;
      const netIncome = revenue - expenses;

      const currentAssets = [
        { name: 'Cash', nameSw: 'Fedha iliyo kwenye akaunti', amount: Math.max(cash, 0) },
        { name: 'Accounts Receivable', nameSw: 'Madeni yanayodaiwa na wateja', amount: accountsReceivable },
        { name: 'Inventory Value', nameSw: 'Thamani ya akiba ya bidhaa', amount: inventoryValue },
      ];

      const fixedAssets = [
        { name: 'Office Equipment', nameSw: 'Vifaa vya ofisi', amount: 0 },
        { name: 'Furniture', nameSw: 'Vifaa vya nyumba', amount: 0 },
      ];

      const currentLiabilities = [
        { name: 'Accounts Payable', nameSw: 'Madeni yanayolipwa kwa suppliers', amount: accountsPayable },
        { name: 'Accrued Expenses', nameSw: 'Gharama zilizokusudia', amount: 0 },
      ];

      const longTermLiabilities = [
        { name: 'Bank Loans', nameSw: 'Mikopo ya benki', amount: 0 },
      ];

      const ownersEquity = [
        { name: 'Owner\'s Capital', nameSw: 'Mali ya asili ya mmiliki', amount: 10000 },
      ];

      setData({
        currentAssets,
        fixedAssets,
        totalCurrentAssets: currentAssets.reduce((sum, a) => sum + a.amount, 0),
        totalFixedAssets: fixedAssets.reduce((sum, a) => sum + a.amount, 0),
        currentLiabilities,
        longTermLiabilities,
        totalCurrentLiabilities: currentLiabilities.reduce((sum, l) => sum + l.amount, 0),
        totalLongTermLiabilities: longTermLiabilities.reduce((sum, l) => sum + l.amount, 0),
        ownersEquity,
        retainedEarnings: netIncome > 0 ? netIncome : 0,
        netIncome,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = data.totalCurrentAssets + data.totalFixedAssets;
  const totalLiabilities = data.totalCurrentLiabilities + data.totalLongTermLiabilities;
  const totalOwnersEquity = data.ownersEquity.reduce((sum, e) => sum + e.amount, 0) + data.retainedEarnings + data.netIncome;
  const totalLiabilitiesAndEquity = totalLiabilities + totalOwnersEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TZS' ? 'TSh' : currency;
    const rows = [
      [t('accounting', 'balanceSheet')],
      [t('common', 'date') + ': ' + new Date(dateFilter).toLocaleDateString()],
      [''],
      [t('accounting', 'currentAssets')],
      ...data.currentAssets.map(a => [a.nameSw + ' (' + a.name + ')', `${currencySymbol}${a.amount.toFixed(2)}`]),
      [t('common', 'total') + ': ' + t('accounting', 'currentAssets'), `${currencySymbol}${data.totalCurrentAssets.toFixed(2)}`],
      [''],
      [t('accounting', 'fixedAssets')],
      ...data.fixedAssets.map(a => [a.nameSw + ' (' + a.name + ')', `${currencySymbol}${a.amount.toFixed(2)}`]),
      [t('common', 'total') + ': ' + t('accounting', 'fixedAssets'), `${currencySymbol}${data.totalFixedAssets.toFixed(2)}`],
      [''],
      [t('common', 'total') + ' ' + t('common', 'asset'), `${currencySymbol}${totalAssets.toFixed(2)}`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${dateFilter}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('accounting', 'balanceSheet')}</h1>
              <p className="text-xs text-slate-500">{t('accounting', 'balanceSheetDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">{t('branches', 'allBranches')}</option>
              {branches.filter(b => b.status === 'active').map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('reports', 'exportCsv')}
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('accounting', 'print')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">{t('accounting', 'balanceSheet')}</h2>
              <p className="text-sm text-slate-300">{t('accounting', 'balanceSheetDescription')} - {new Date(dateFilter).toLocaleDateString('en-GB')}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('accounting', 'currentAssetsLong')}</h3>
                {data.currentAssets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-700">{asset.name}</span>
                      <span className="text-xs text-slate-400 block">{asset.nameSw}</span>
                    </div>
                    <span className="font-medium text-slate-800">{formatCurrency(asset.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('accounting', 'totalRevenue2')} {t('accounting', 'currentAssets')}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(data.totalCurrentAssets, currency)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('accounting', 'fixedAssetsLong')}</h3>
                {data.fixedAssets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-700">{asset.name}</span>
                      <span className="text-xs text-slate-400 block">{asset.nameSw}</span>
                    </div>
                    <span className="font-medium text-slate-800">{formatCurrency(asset.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('accounting', 'totalRevenue2')} {t('accounting', 'fixedAssets')}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(data.totalFixedAssets, currency)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 bg-slate-800 px-4 rounded-lg">
                <span className="font-bold text-white">{t('common', 'total')} {t('common', 'asset')}</span>
                <span className="font-bold text-white text-xl">{formatCurrency(totalAssets, currency)}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('accounting', 'currentLiabilitiesLong')}</h3>
                {data.currentLiabilities.map((liability, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-700">{liability.name}</span>
                      <span className="text-xs text-slate-400 block">{liability.nameSw}</span>
                    </div>
                    <span className="font-medium text-slate-800">{formatCurrency(liability.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('accounting', 'totalRevenue2')} {t('accounting', 'currentLiabilities')}</span>
                  <span className="font-bold text-red-600">{formatCurrency(data.totalCurrentLiabilities, currency)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('accounting', 'longTermLiabilitiesLong')}</h3>
                {data.longTermLiabilities.map((liability, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-700">{liability.name}</span>
                      <span className="text-xs text-slate-400 block">{liability.nameSw}</span>
                    </div>
                    <span className="font-medium text-slate-800">{formatCurrency(liability.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('accounting', 'totalRevenue2')} {t('accounting', 'longTermLiabilities')}</span>
                  <span className="font-bold text-red-600">{formatCurrency(data.totalLongTermLiabilities, currency)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{t('accounting', 'ownersEquityLong')}</h3>
                {data.ownersEquity.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-xs text-slate-400 block">{item.nameSw}</span>
                    </div>
                    <span className="font-medium text-green-600">{formatCurrency(item.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">{t('accounting', 'retainedEarnings')}</span>
                    <span className="text-xs text-slate-400 block">{t('accounting', 'retainedEarningsLong')}</span>
                  </div>
                  <span className="font-medium text-green-600">{formatCurrency(data.retainedEarnings, currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">{t('accounting', 'profitLoss')}</span>
                    <span className="text-xs text-slate-400 block">{t('accounting', 'profitLossLong')}</span>
                  </div>
                  <span className={`font-medium ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netIncome, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">{t('accounting', 'ownersEquityLong')}</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalOwnersEquity, currency)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg">
                <span className="font-bold text-slate-800">{t('common', 'total')} {t('accounting', 'currentLiabilities')}</span>
                <span className="font-bold text-red-600">{formatCurrency(totalLiabilities, currency)}</span>
              </div>

              <div className={`border-t-2 border-slate-200 pt-4 ${isBalanced ? 'bg-green-50' : 'bg-red-50'} px-4 rounded-lg`}>
                <div className="flex justify-between items-center py-3">
                  <span className="font-bold text-lg text-slate-800">
                    {t('common', 'total')} {t('accounting', 'currentLiabilities')} & {t('accounting', 'ownersEquity')}
                  </span>
                  <span className={`font-bold text-xl ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalLiabilitiesAndEquity, currency)}
                    {!isBalanced && ' ⚠️'}
                  </span>
                </div>
                {isBalanced && (
                  <p className="text-xs text-green-600 text-center pb-2">✓ Balance Sheet is balanced</p>
                )}
                {!isBalanced && (
                  <p className="text-xs text-red-600 text-center pb-2">⚠️ Balance Sheet is NOT balanced! Difference: {formatCurrency(totalAssets - totalLiabilitiesAndEquity, currency)}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}