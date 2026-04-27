'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Link from 'next/link';
import { Bell, Bot, RefreshCw, ShoppingCart } from 'lucide-react';
import LanguageCurrencySelector from './LanguageCurrencySelector';
import MobileNav from './MobileNav';

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
    <>
      <header className="flex items-center w-full justify-between px-4 py-2 h-14 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary" />
          <div className="hidden-mobile">
            <h1 className="font-bold text-lg">POS</h1>
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
          
        </div>
      </header>
      <MobileNav />
    </>
  );
}
