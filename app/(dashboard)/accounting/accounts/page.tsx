'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, Search, Pencil, Trash2, X, Building2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

export default function AccountingAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: 'Cash', type: 'Asset', balance: 0 },
    { id: '2', name: 'Accounts Receivable', type: 'Asset', balance: 0 },
    { id: '3', name: 'Inventory', type: 'Asset', balance: 0 },
    { id: '4', name: 'Accounts Payable', type: 'Liability', balance: 0 },
    { id: '5', name: 'Sales Revenue', type: 'Revenue', balance: 0 },
    { id: '6', name: 'Cost of Goods Sold', type: 'Expense', balance: 0 },
    { id: '7', name: 'Rent Expense', type: 'Expense', balance: 0 },
    { id: '8', name: 'Utilities Expense', type: 'Expense', balance: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Asset' });
  const { currency } = useAppStore();

  useEffect(() => {
    calculateBalances();
  }, []);

  const calculateBalances = async () => {
    try {
      const [salesRes, expensesRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
      ]);

      let cash = 0;
      let revenue = 0;
      let cogs = 0;
      let expenses = 0;

      if (salesRes.ok) {
        const sales = await salesRes.json();
        revenue = sales.reduce((sum: number, s: { totalAmount: number }) => sum + s.totalAmount, 0);
        cash += revenue;
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        expenses = expensesData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
      }

      setAccounts(prev => prev.map(acc => {
        if (acc.name === 'Cash') return { ...acc, balance: cash };
        if (acc.name === 'Sales Revenue') return { ...acc, balance: revenue };
        if (acc.name === 'Cost of Goods Sold') return { ...acc, balance: cogs };
        if (acc.name === 'Rent Expense' || acc.name === 'Utilities Expense') return { ...acc, balance: expenses / 2 };
        return acc;
      }));
    } catch (err) {
      console.error('Error calculating balances:', err);
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0);

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) return;
    const account: Account = {
      id: Date.now().toString(),
      ...newAccount,
      balance: 0,
    };
    setAccounts([...accounts, account]);
    setNewAccount({ name: '', type: 'Asset' });
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-slate-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Chart of Accounts</h1>
              <p className="text-xs text-slate-500">Manage your accounting accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Assets</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalAssets, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Liabilities</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalLiabilities, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Revenue</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue, currency)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">Total Expenses</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalExpenses, currency)}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          {accountTypes.map((type) => (
            <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-700">{type}</h3>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.filter(a => a.type === type).map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-sm text-slate-800">{account.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sm text-slate-800">
                        {formatCurrency(account.balance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add Account</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Account Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAccount}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}