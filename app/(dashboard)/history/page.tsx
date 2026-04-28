'use client';

import { useEffect, useState } from 'react';
import { History, Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, formatTime } from '@/lib/format';

interface Activity {
  id: string;
  action: string;
  recordType: string;
  recordId: string;
  details: string;
  createdAt: string;
  user: { name: string; email: string };
  branch: { name: string };
}

export default function HistoryPage() {
  const { language, t, branches, currentBranch } = useAppStore();
  const isSwahili = language === 'sw';
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    actionType: '',
    recordType: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const limit = 50;

  useEffect(() => {
    fetchActivities();
  }, [page, filters]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('page', page.toString());
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.actionType) params.set('actionType', filters.actionType);
      if (filters.recordType) params.set('recordType', filters.recordType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/activity-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    const headers = ['Date', 'Time', 'User', 'Branch', 'Action', 'Type', 'Details'];
    const rows = activities.map(a => [
      formatDate(a.createdAt, 'short', language),
      formatTime(a.createdAt, true, language),
      a.user?.name || '-',
      a.branch?.name || '-',
      a.action,
      a.recordType,
      a.details,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${formatDate(new Date(), 'iso', language)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionLabels = isSwahili ? {
    create: 'Udugizo', update: 'Marekebisho', delete: 'Ufutaji', void: 'Kubatiliwa',
    activate: 'Kuwezesha', deactivate: 'Kuzimwa', login: 'Kuingia', logout: 'Kutoka',
    stock_adjust: 'Marekebisho wa Hisa', price_change: 'Mabadiliko ya Bei',
  } : {
    create: 'Created', update: 'Updated', delete: 'Deleted', void: 'Voided',
    activate: 'Activated', deactivate: 'Deactivated', login: 'Login', logout: 'Logout',
    stock_adjust: 'Stock Adjusted', price_change: 'Price Changed',
  };

  const recordLabels = isSwahili ? {
    product: 'Bidhaa', sale: 'Uuzaji', customer: 'Mteja', supplier: 'Muuzaji',
    expense: 'Gharama', branch: 'Duka', user: 'Mtumiaji',
  } : {
    product: 'Product', sale: 'Sale', customer: 'Customer', supplier: 'Supplier',
    expense: 'Expense', branch: 'Branch', user: 'User',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">
                {isSwahili ? 'Historia ya Shughuli' : 'Activity History'}
              </h1>
              <p className="text-xs text-slate-500">
                {total} {isSwahili ? 'matukio' : 'events'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Filter className="w-4 h-4" />
              {isSwahili ? 'Chuja' : 'Filter'}
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              {isSwahili ? 'Shepura CSV' : 'Export CSV'}
            </button>
          </div>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Mtumiaji' : 'User'}
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Kitendo' : 'Action'}
              </label>
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">-</option>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isSwahili ? 'Aina ya Rekodi' : 'Record Type'}
              </label>
              <select
                value={filters.recordType}
                onChange={(e) => setFilters({ ...filters, recordType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">-</option>
                {Object.entries(recordLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
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
                  {isSwahili ? 'Tarehe' : 'Date'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Mtumiaji' : 'User'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Duka' : 'Branch'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Kitendo' : 'Action'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Aina' : 'Type'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {isSwahili ? 'Maelezo' : 'Details'}
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
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {isSwahili ? 'Hakuna shughuli bado' : 'No activities yet'}
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{formatDate(activity.createdAt, 'short', language)}</div>
                      <div className="text-xs text-slate-400">{formatTime(activity.createdAt, true, language)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {activity.user?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {activity.branch?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.action === 'create' ? 'bg-green-100 text-green-700' :
                        activity.action === 'update' ? 'bg-blue-100 text-blue-700' :
                        activity.action === 'delete' || activity.action === 'void' ? 'bg-red-100 text-red-700' :
                        activity.action === 'deactivate' ? 'bg-slate-100 text-slate-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {actionLabels[activity.action as keyof typeof actionLabels] || activity.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {recordLabels[activity.recordType as keyof typeof recordLabels] || activity.recordType}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {activity.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            {isSwahili ? 'Ukurasa' : 'Page'} {page} {isSwahili ? 'ya' : 'of'} {Math.ceil(total / limit)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}