'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, Branch } from '@/store';
import Link from 'next/link';
import { Bell, Bot, RefreshCw, ShoppingCart, ChevronDown, Building2, Package, ShoppingCart as CartIcon, RotateCcw, DollarSign, Calendar, X } from 'lucide-react';
import LanguageCurrencySelector from './LanguageCurrencySelector';

interface Notification {
  id: string;
  type: string;
  messageEn: string;
  messageSw: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNav() {
  const { user, setUser, branches, setBranches, currentBranch, setCurrentBranch, t, language } = useAppStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (user) {
        setChecked(true);
        return;
      }

      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session check error:', err);
        router.push('/login');
      } finally {
        setChecked(true);
      }
    };

    checkSession();
  }, [user, setUser, router]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (res.ok) {
          const data: Branch[] = await res.json();
          setBranches(data);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };

    if (checked) {
      fetchBranches();
    }
  }, [checked, setBranches]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=10');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    if (checked) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [checked]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchSelect = (branch: Branch | null) => {
    setCurrentBranch(branch);
    setShowBranchDropdown(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="w-4 h-4" />;
      case 'large_sale': return <CartIcon className="w-4 h-4" />;
      case 'return_processed': return <RotateCcw className="w-4 h-4" />;
      case 'payment_overdue': return <DollarSign className="w-4 h-4" />;
      case 'daily_summary': return <Calendar className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const allBranchesOption = { id: 'all', name: t('branches', 'allBranches') || 'All Branches', code: 'ALL', isMainBranch: false, status: 'active' } as Branch;

  if (!checked) {
    return (
      <header className="h-14 bg-slate-100 border-b border-slate-200 animate-pulse" />
    );
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 h-14 bg-slate-100 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg">{t('settings', 'businessName') || 'Duka Janja POS'}</h1>
          <p className="text-xs text-slate-500">{t('nav', 'pos')} 01</p>
        </div>

        <div className="relative ml-4">
          <button
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            <Building2 className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {currentBranch ? currentBranch.name : t('branches', 'allBranches') || 'All Branches'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showBranchDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => handleBranchSelect(null)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                  !currentBranch ? 'bg-primary/10 text-primary font-medium' : ''
                }`}
              >
                {t('branches', 'allBranches') || 'All Branches'}
              </button>
              {branches.filter(b => b.status === 'active').map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                    currentBranch?.id === branch.id ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  {branch.name}
                  {branch.isMainBranch && (
                    <span className="ml-2 text-xs text-primary">(Main)</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageCurrencySelector />
        <Link
          href="/chatbot"
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          title={t('nav', 'chatbot')}
        >
          <Bot className="w-5 h-5 text-slate-600" />
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-sm">Notifications</h3>
                <Link 
                  href="/notifications" 
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  View All
                </Link>
              </div>
              
              <div className="overflow-y-auto max-h-72">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${!notification.isRead ? 'bg-amber-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {language === 'sw' ? notification.messageSw : notification.messageEn}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-xs text-blue-600 hover:underline flex-shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          href="/pos"
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          title={t('nav', 'pos')}
        >
          <ShoppingCart className="w-5 h-5 text-slate-600" />
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-xs font-medium">{user?.name || t('common', 'users')}</span>
        </Link>
      </div>
    </header>
  );
}