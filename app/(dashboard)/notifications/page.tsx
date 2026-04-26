'use client';

import { useEffect, useState } from 'react';
import { 
  Bell, Search, Filter, Check, CheckCheck, Package, 
  ShoppingCart, RotateCcw, DollarSign, Calendar, Eye,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency } from '@/lib/i18n';

interface Notification {
  id: string;
  type: string;
  messageEn: string;
  messageSw: string;
  branchId: string | null;
  relatedRecordId: string | null;
  relatedRecordType: string | null;
  relatedRecordNumber: string | null;
  isRead: boolean;
  createdAt: string;
}

const LABELS = {
  en: {
    title: 'Notifications',
    markRead: 'Mark Read',
    markAllRead: 'Mark All Read',
    filter: 'Filter',
    type: 'Type',
    all: 'All',
    read: 'Read',
    unread: 'Unread',
    date: 'Date',
    noNotifications: 'No notifications',
    lowStock: 'Low Stock',
    largeSale: 'Large Sale',
    returnProcessed: 'Return Processed',
    dailySummary: 'Daily Summary',
    paymentOverdue: 'Payment Overdue',
  },
  sw: {
    title: 'Arifa',
    markRead: 'Weka Kama Soma',
    markAllRead: 'Weka Majsoma Yote',
    filter: 'Chuja',
    type: 'Aina',
    all: 'Zote',
    read: 'Zimesoma',
    unread: 'Hazijasoma',
    date: 'Tarehe',
    noNotifications: 'Hakuna arifa',
    lowStock: 'Hisa Chache',
    largeSale: 'Mauzo Makubwa',
    returnProcessed: 'Rudisha Imepitiwa',
    dailySummary: 'Muhtasari Wa Siku',
    paymentOverdue: 'Malipo Yachelea',
  },
};

const TYPE_ICONS: Record<string, string> = {
  low_stock: 'Package',
  large_sale: 'ShoppingCart',
  return_processed: 'RotateCcw',
  daily_summary: 'Calendar',
  payment_overdue: 'DollarSign',
};

export default function NotificationsPage() {
  const { currency, branches, language } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const labels = LABELS[language as keyof typeof LABELS] || LABELS.en;

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, statusFilter, branchFilter, dateFrom, dateTo]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('isRead', statusFilter === 'unread' ? 'false' : 'true');
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      params.append('limit', '100');

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, { en: string; sw: string }> = {
      low_stock: { en: 'Low Stock', sw: 'Hisa Chache' },
      large_sale: { en: 'Large Sale', sw: 'Mauzo Makubwa' },
      return_processed: { en: 'Return Processed', sw: 'Rudisha Imepitiwa' },
      daily_summary: { en: 'Daily Summary', sw: 'Muhtasari' },
      payment_overdue: { en: 'Payment Overdue', sw: 'Malipo Yachelea' },
    };
    return typeLabels[type]?.[language as 'en' | 'sw'] || type;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-amber-600" />
            <div>
              <h1 className="font-bold text-xl text-slate-800">{labels.title}</h1>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              {labels.markAllRead}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">{labels.type}: {labels.all}</option>
            <option value="low_stock">{labels.lowStock}</option>
            <option value="large_sale">{labels.largeSale}</option>
            <option value="return_processed">{labels.returnProcessed}</option>
            <option value="daily_summary">{labels.dailySummary}</option>
            <option value="payment_overdue">{labels.paymentOverdue}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Status: {labels.all}</option>
            <option value="unread">{labels.unread}</option>
            <option value="read">{labels.read}</option>
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Branch: {labels.all}</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="To"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-amber-600 border-t-transparent h-8 w-8"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{labels.noNotifications}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-12">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">{labels.date}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <tr key={notification.id} className={`hover:bg-slate-50 ${!notification.isRead ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        {notification.type === 'low_stock' && <Package className="w-4 h-4 text-amber-600" />}
                        {notification.type === 'large_sale' && <ShoppingCart className="w-4 h-4 text-amber-600" />}
                        {notification.type === 'return_processed' && <RotateCcw className="w-4 h-4 text-amber-600" />}
                        {notification.type === 'daily_summary' && <Calendar className="w-4 h-4 text-amber-600" />}
                        {notification.type === 'payment_overdue' && <DollarSign className="w-4 h-4 text-amber-600" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">
                        {language === 'sw' ? notification.messageSw : notification.messageEn}
                      </p>
                      {notification.relatedRecordNumber && (
                        <p className="text-xs text-slate-500">
                          Ref: {notification.relatedRecordNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {notification.branchId 
                        ? branches.find(b => b.id === notification.branchId)?.name || '-'
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {getTimeAgo(notification.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        notification.isRead 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {notification.isRead ? labels.read : labels.unread}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1.5 hover:bg-green-100 rounded text-green-600"
                          title={labels.markRead}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}