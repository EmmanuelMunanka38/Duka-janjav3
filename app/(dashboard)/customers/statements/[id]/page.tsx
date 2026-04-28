'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, FileText, X, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creditBalance: number;
  creditLimit: number;
  sales: Sale[];
}

export default function CustomerStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { currency } = useAppStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const { id } = await params;
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        setCustomer(await res.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-8 w-8"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Customer not found</p>
      </div>
    );
  }

  const filteredSales = customer.sales?.filter(s => {
    if (dateFrom && new Date(s.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(s.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }) || [];

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const openingBalance = 0;
  const closingBalance = customer.creditBalance || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg" id="statement-content">
          <div className="text-center border-b border-slate-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              DUKA JANJA
            </h1>
            <p className="text-sm text-slate-500">
              Account Statement | RIPOTI YA AKAUNTI
            </p>
          </div>

          <div className="flex justify-between mb-6">
            <div>
              <p className="font-bold text-lg">{customer.name}</p>
              {customer.email && <p className="text-sm text-slate-500">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">
                Period: {dateFrom || 'All'} to {dateTo || 'All'}
              </p>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-bold text-slate-500">Date</th>
                <th className="text-left py-2 text-sm font-bold text-slate-500">Ref</th>
                <th className="text-right py-2 text-sm font-bold text-slate-500">Debit</th>
                <th className="text-right py-2 text-sm font-bold text-slate-500">Credit</th>
                <th className="text-right py-2 text-sm font-bold text-slate-500">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-sm">-</td>
                <td className="py-2 text-sm">Opening</td>
                <td className="py-2 text-sm text-right">-</td>
                <td className="py-2 text-sm text-right">-</td>
                <td className="py-2 text-sm text-right font-medium">
                  {formatCurrency(openingBalance, currency)}
                </td>
              </tr>
              {filteredSales.map(sale => (
                <tr key={sale.id} className="border-b border-slate-100">
                  <td className="py-2 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 text-sm">{sale.saleNumber}</td>
                  <td className="py-2 text-sm text-right">{formatCurrency(sale.totalAmount, currency)}</td>
                  <td className="py-2 text-sm text-right">-</td>
                  <td className="py-2 text-sm text-right">-</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={2} className="py-2 font-bold">Totals</td>
                <td className="py-2 text-right font-bold">{formatCurrency(totalSales, currency)}</td>
                <td className="py-2 text-right font-bold">-</td>
                <td className="py-2 text-right font-bold"></td>
              </tr>
              <tr className="border-t border-slate-300">
                <td colSpan={4} className="py-2 font-bold text-lg">Closing Balance</td>
                <td className="py-2 text-right font-bold text-lg text-amber-600">
                  {formatCurrency(closingBalance, currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center text-xs text-slate-400 pt-8">
            <p>Thank you for your business | Asante za biashara yako</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}