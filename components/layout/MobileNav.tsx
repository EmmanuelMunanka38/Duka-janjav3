'use client';

import Link from 'next/link';
import { useAppStore } from '@/store';
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/inventory', icon: Package, labelKey: 'inventory' },
  { href: '/pos', icon: ShoppingCart, labelKey: 'pos' },
  { href: '/sales', icon: FileText, labelKey: 'sales' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
];

export default function MobileNav() {
  const { t } = useAppStore();

  return (
    <nav className="md:hidden nav-bar bg-white border-t border-slate-200">
      {navItems.map(({ href, icon: Icon, labelKey }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-1 p-2">
          <Icon className="w-5 h-5" />
          <span className="text-xs">{t('nav', labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
