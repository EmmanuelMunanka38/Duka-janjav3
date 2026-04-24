'use client';

import { useEffect, useState } from 'react';
import { Scale, Download } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface BalanceSheetData {
  assets: { name: string; amount: number }[];
  totalAssets: number;
  liabilities: { name: string; amount: number }[];
  totalLiabilities: number;
  equity: { name: string; amount: number }[];
  totalEquity: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData>({
    assets: [],
    totalAssets: 0,
    liabilities: [],
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
  });
  const [loading, setLoading] = useState(true);
  const { currency } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
        fetch('/api/products'),
      ]);

      let cash = 0;
      let revenue = 0;
      let expenses = 0;
      let inventoryValue = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        cash = revenue;
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        expenses = expensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
        cash -= expenses;
      }

      if (productsRes.ok) {
        const products = await productsRes.json();
        inventoryValue = products.reduce((sum: number, p: { stock: number; cost: number }) => sum + p.stock * p.cost, 0);
      }

      const assets = [
        { name: 'Cash', amount: Math.max(cash, 0) },
        { name: 'Accounts Receivable', amount: 0 },
        { name: 'Inventory', amount: inventoryValue },
      ];

      const liabilities = [
        { name: 'Accounts Payable', amount: 0 },
      ];

      const equity = [
        { name: 'Owner\'s Capital', amount: 10000 },
        { name: 'Retained Earnings', amount: revenue - expenses },
        { name: 'Revenue', amount: revenue },
        { name: 'Less: Expenses', amount: -expenses },
      ];

      setData({
        assets,
        totalAssets: assets.reduce((sum, a) => sum + a.amount, 0),
        liabilities,
        totalLiabilities: liabilities.reduce((sum, l) => sum + l.amount, 0),
        equity,
        totalEquity: 10000 + (revenue - expenses),
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'KES' ? 'KSh' : currency === 'TZS' ? 'TSh' : currency === 'UGX' ? 'USh' : currency;
    const csvContent = [
      ['BALANCE SHEET', `Date: ${new Date().toLocaleDateString()}`],
      [''],
      ['ASSETS'],
      ...data.assets.map(a => [a.name, `${currencySymbol}${a.amount.toFixed(2)}`]),
      ['Total Assets', `${currencySymbol}${data.totalAssets.toFixed(2)}`],
      [''],
      ['LIABILITIES'],
      ...data.liabilities.map(l => [l.name, `${currencySymbol}${l.amount.toFixed(2)}`]),
      ['Total Liabilities', `${currencySymbol}${data.totalLiabilities.toFixed(2)}`],
      [''],
      ['EQUITY'],
      ...data.equity.map(e => [e.name, `${currencySymbol}${Math.abs(e.amount).toFixed(2)}`]),
      ['Total Equity', `${currencySymbol}${data.totalEquity.toFixed(2)}`],
      [''],
      ['Total Liabilities & Equity', `${currencySymbol}${(data.totalLiabilities + data.totalEquity).toFixed(2)}`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Balance Sheet</h1>
              <p className="text-xs text-slate-500">Assets, Liabilities & Equity</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white">
              <h2 className="text-lg font-bold">Balance Sheet</h2>
              <p className="text-sm text-slate-300">As of {new Date().toLocaleDateString()}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Assets</h3>
                {data.assets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-700">{asset.name}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(asset.amount, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">Total Assets</span>
                  <span className="font-bold text-blue-600">{formatCurrency(data.totalAssets, currency)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Liabilities</h3>
                {data.liabilities.length === 0 || (data.liabilities.length === 1 && data.liabilities[0].amount === 0) ? (
                  <p className="text-sm text-slate-400 py-2">No liabilities recorded</p>
                ) : (
                  data.liabilities.map((liability, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-700">{liability.name}</span>
                      <span className="font-medium text-slate-800">{formatCurrency(liability.amount, currency)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">Total Liabilities</span>
                  <span className="font-bold text-red-600">{formatCurrency(data.totalLiabilities, currency)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Equity</h3>
                {data.equity.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-700">{item.name}</span>
                    <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(item.amount), currency)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg mt-2">
                  <span className="font-bold text-slate-800">Total Equity</span>
                  <span className="font-bold text-green-600">{formatCurrency(data.totalEquity, currency)}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-4">
                <div className="flex justify-between items-center py-3 px-4 bg-slate-800 rounded-lg">
                  <span className="text-lg font-bold text-white">Total Liabilities & Equity</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(data.totalLiabilities + data.totalEquity, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}