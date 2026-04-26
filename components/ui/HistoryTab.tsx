'use client';

import { useEffect, useState } from 'react';
import { Clock, User } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, formatTime } from '@/lib/format';

interface HistoryEntry {
  id: string;
  action: string;
  recordType: string;
  recordId: string;
  details: string;
  oldValues: string;
  newValues: string;
  createdAt: string;
  user: { name: string };
  branch: { name: string };
}

interface HistoryTabProps {
  recordType: string;
  recordId: string;
}

export default function HistoryTab({ recordType, recordId }: HistoryTabProps) {
  const { language } = useAppStore();
  const isSwahili = language === 'sw';
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [recordType, recordId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity-log?recordType=${recordType}&recordId=${recordId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.activities);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = isSwahili ? {
    create: 'Udugizo',
    update: 'Marekebisho',
    delete: 'Ufutaji',
    void: 'Kubatiliwa',
    restore: 'Kurejesha',
    activate: 'Kuwezesha',
    deactivate: 'Kuzimwa',
    stock_adjust: 'Marekebisho wa Hisa',
    price_change: 'Mabadiliko ya Bei',
  } : {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    void: 'Voided',
    restore: 'Restored',
    activate: 'Activated',
    deactivate: 'Deactivated',
    stock_adjust: 'Stock Adjusted',
    price_change: 'Price Changed',
  };

  const parseValues = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full border-2 border-primary border-t-transparent h-6 w-6"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {isSwahili ? 'Hakuna historia bado' : 'No history yet'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const oldVals = parseValues(entry.oldValues);
        const newVals = parseValues(entry.newValues);
        
        return (
          <div key={entry.id} className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {formatDate(entry.createdAt, 'short', language)} {formatTime(entry.createdAt, true, language)}
                </span>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                entry.action === 'create' ? 'bg-green-100 text-green-700' :
                entry.action === 'update' ? 'bg-blue-100 text-blue-700' :
                entry.action === 'void' || entry.action === 'delete' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {actionLabels[entry.action as keyof typeof actionLabels] || entry.action}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
              <User className="w-3 h-3" />
              <span>{entry.user?.name || '-'}</span>
              {entry.branch?.name && (
                <>
                  <span className="text-slate-300 mx-1">|</span>
                  <span>{entry.branch.name}</span>
                </>
              )}
            </div>
            
            {entry.details && (
              <p className="text-sm text-slate-600 mb-2">{entry.details}</p>
            )}
            
            {(oldVals || newVals) && (
              <div className="mt-2 text-xs border-t border-slate-200 pt-2">
                {oldVals && newVals && Object.keys(newVals).map(key => {
                  if (oldVals[key] !== newVals[key]) {
                    return (
                      <div key={key} className="flex gap-2 py-0.5">
                        <span className="text-slate-500 w-24">{key}:</span>
                        <span className="text-red-600 line-through">{String(oldVals[key])}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-green-600">{String(newVals[key])}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}