'use client';

import { useEffect, useState } from 'react';
import { Receipt, Search, RefreshCw, AlertTriangle, Undo2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  customerName: string | null;
  items: { quantity: number; product: { name: string } }[];
  createdAt: string;
}

interface SaleReturn {
  id: string;
  originalSaleId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function SalesReturnsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModal, setSelectedModal] = useState<'return' | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { currency } = useAppStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes] = await Promise.all([
        fetch('/api/sales'),
      ]);

      if (salesRes.ok) {
        const salesData: Sale[] = await salesRes.json();
        setSales(salesData);
      }
      setReturns([]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => 
    s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReturn = async () => {
    if (!selectedSale || !reason.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          amount: selectedSale.totalAmount,
          reason: reason,
        }),
      });

      if (res.ok) {
        setSelectedModal(null);
        setSelectedSale(null);
        setReason('');
      }
    } catch (err) {
      console.error('Error processing return:', err);
    } finally {
      setProcessing(false);
    }
  };

  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);
  const totalProcessed = returns.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Undo2 className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">Sales Returns</h1>
              <p className="text-xs text-slate-500">Process returns and refunds</p>
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
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Returns</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(totalReturns, currency)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Processed</p>
                <p className="text-xl font-bold text-slate-800">{totalProcessed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Available Sales</p>
                <p className="text-xl font-bold text-slate-800">{sales.length}</p>
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
              placeholder="Search sales..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No sales found</h3>
            <p className="text-slate-500">Sales will appear here after transactions</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sale #</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.slice(0, 50).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm text-slate-800">{sale.saleNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {sale.customerName || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm text-orange-600">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setSelectedModal('return');
                        }}
                        className="px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded"
                      >
                        Process Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selectedModal === 'return' && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Process Return</h3>
              <button onClick={() => setSelectedModal(null)} className="p-1 hover:bg-slate-100 rounded">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Sale</p>
                <p className="font-medium">{selectedSale.saleNumber}</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(selectedSale.totalAmount, currency)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Reason for Return</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select reason</option>
                  <option value="defective">Defective Product</option>
                  <option value="wrong_item">Wrong Item Received</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="changed_mind">Customer Changed Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedModal(null)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturn}
                  disabled={!reason || processing}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
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