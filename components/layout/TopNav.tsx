'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Link from 'next/link';
import { Bell, Bot, RefreshCw, ShoppingCart } from 'lucide-react';
import LanguageCurrencySelector from './LanguageCurrencySelector';

export default function TopNav() {
  const { user, setUser, t } = useAppStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

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
          <h1 className="font-bold text-lg">Duka Janja POS</h1>
          <p className="text-xs text-slate-500">Terminal 01</p>
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
        <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
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
