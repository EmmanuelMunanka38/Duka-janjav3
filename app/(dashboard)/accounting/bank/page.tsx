'use client';

import { useEffect, useState } from 'react';
import { Building2, DollarSign, Download, CreditCard, Landmark, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'business';
  balance: number;
  transactions: { date: string; description: string; amount: number; type: 'credit' | 'debit' }[];
}

export default function BankPage() {
  const { currency, t } = useAppStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
      ]);

      let totalSales = 0;
      let totalExpenses = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        totalSales = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        totalExpenses = expensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }

      const checkingBalance = totalSales * 0.4;
      const savingsBalance = totalSales * 0.3;
      const businessBalance = totalSales - checkingBalance - savingsBalance;

      setAccounts([
        {
          id: 'checking',
          name: 'Business Checking',
          type: 'checking',
          balance: checkingBalance,
          transactions: [
            { date: new Date().toISOString().split('T')[0], description: t('pos', 'completeSale'), amount: totalSales * 0.1, type: 'credit' },
            { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], description: t('common', 'total') + ' ' + t('common', 'expenses'), amount: totalExpenses * 0.3, type: 'debit' },
            { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], description: t('reports', 'netProfit'), amount: totalSales * 0.05, type: 'credit' },
          ],
        },
        {
          id: 'savings',
          name: 'Business Savings',
          type: 'savings',
          balance: savingsBalance,
          transactions: [
            { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], description: t('common', 'total') + ' Transfer', amount: totalSales * 0.1, type: 'credit' },
            { date: new Date(Date.now() - 259200000).toISOString().split('T')[0], description: t('common', 'tax'), amount: totalSales * 0.02, type: 'credit' },
          ],
        },
        {
          id: 'business',
          name: 'Business Reserve',
          type: 'business',
          balance: businessBalance,
          transactions: [
            { date: new Date().toISOString().split('T')[0], description: t('common', 'business') + ' ' + t('common', 'total'), amount: totalSales * 0.15, type: 'credit' },
          ],
        },
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const currencySymbol = currency === 'USD' ? '$' : 'TSh';
    const csvContent = [
      [t('common', 'bank').toUpperCase(), 'REPORT'],
      [''],
      ...accounts.flatMap(account => [
        [account.name, `${currencySymbol}${account.balance.toFixed(2)}`],
        [t('common', 'date'), t('common', 'description'), t('common', 'total')],
        ...account.transactions.map(tx => [tx.date, tx.description, `${tx.type === 'credit' ? '+' : '-'}${currencySymbol}${tx.amount.toFixed(2)}`]),
        [''],
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const selectedAccountData = accounts.find(a => a.id === selectedAccount) || accounts[0];

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return CreditCard;
      case 'savings':
        return Landmark;
      default:
        return Building2;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{t('common', 'bank')}</h1>
              <p className="text-xs text-slate-500">{t('common', 'accounting')}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('reports', 'exportCsv')}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">{t('common', 'total')} {t('common', 'bank')}</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance, currency)}</p>
                </div>
                <Landmark className="w-16 h-16 text-indigo-300 opacity-50" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {accounts.map((account) => {
                const Icon = getAccountIcon(account.type);
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    className={`bg-white rounded-xl p-5 border text-left transition-all hover:shadow-md ${
                      selectedAccount === account.id || (!selectedAccount && account === accounts[0])
                        ? 'border-primary shadow-md'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{account.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(account.balance, currency)}</p>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getAccountIcon(selectedAccountData?.type || 'checking');
                    return <Icon className="w-5 h-5" />;
                  })()}
                  <h2 className="text-lg font-bold">{selectedAccountData?.name || accounts[0]?.name}</h2>
                </div>
                <span className="text-slate-300 text-sm">
                  {formatCurrency(selectedAccountData?.balance || accounts[0]?.balance || 0, currency)}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">{t('common', 'transactions')}</h3>
                <div className="space-y-3">
                  {(selectedAccountData?.transactions || accounts[0]?.transactions || []).length === 0 ? (
                    <p className="text-center text-slate-400 py-8">{t('messages', 'noData')}</p>
                  ) : (
                    (selectedAccountData?.transactions || accounts[0]?.transactions || []).map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {tx.type === 'credit' ? (
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{tx.description}</p>
                            <p className="text-xs text-slate-400">{tx.date}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}