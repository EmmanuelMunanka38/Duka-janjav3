'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Eye, Printer, Download, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, formatTime } from '@/lib/format';

interface DocumentItem {
  id: string;
  type: string;
  reference: string;
  title: string;
  createdAt: string;
  user: { name: string };
  branch: { name: string };
}

export default function DocumentsPage() {
  const { language, t } = useAppStore();
  const isSwahili = language === 'sw';
  
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    branchId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const documentTypes = isSwahili ? {
    receipt: 'Hati ya Malipo',
    invoice: 'Ankara',
    statement: 'Hati ya Akaunti',
    credit_note: 'Hati ya Mkopo',
    debit_note: 'Hati ya Deni',
    purchase_order: 'Agizo la Ununuzi',
    delivery_note: 'Hati ya Kupokelea',
    return_note: 'Hati ya Rudisha',
  } : {
    receipt: 'Receipt',
    invoice: 'Invoice',
    statement: 'Statement',
    credit_note: 'Credit Note',
    debit_note: 'Debit Note',
    purchase_order: 'Purchase Order',
    delivery_note: 'Delivery Note',
    return_note: 'Return Note',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">
                {isSwahili ? 'Maktaba ya Hati' : 'Document Archive'}
              </h1>
              <p className="text-xs text-slate-500">
                {documents.length} {isSwahili ? 'hati' : 'documents'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" />
            {isSwahili ? 'Chuja' : 'Filter'}
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Aina ya Hati' : 'Document Type'}
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">-</option>
                {Object.entries(documentTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Tafuta' : 'Search'}
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={isSwahili ? 'Namba ya Kumbukumbu...' : 'Reference number...'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Tarehe Kutoka' : 'From Date'}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Tarehe Hadi' : 'To Date'}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <main className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Namba ya Kumbukumbu' : 'Reference'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Aina' : 'Type'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Kichwa' : 'Title'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Tarehe' : 'Date'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Mtumiaji' : 'User'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  {isSwahili ? 'Vitendo' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {isSwahili ? 'Inapakia...' : 'Loading...'}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {isSwahili ? 'Hakuna hati bado' : 'No documents yet'}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800">
                      {doc.reference}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {documentTypes[doc.type as keyof typeof documentTypes] || doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {doc.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{formatDate(doc.createdAt, 'short', language)}</div>
                      <div className="text-xs text-slate-400">{formatTime(doc.createdAt, true, language)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {doc.user?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 hover:bg-slate-100 rounded" title={isSwahili ? 'Tazama' : 'View'}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded" title={isSwahili ? 'Chapisha' : 'Print'}>
                          <Printer className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded" title={isSwahili ? 'Shusha PDF' : 'Download PDF'}>
                          <Download className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}