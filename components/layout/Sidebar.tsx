'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Receipt,
  BarChart,
  Truck,
  Bot,
  Settings,
  HelpCircle,
  LogOut,
  RefreshCw,
  Users,
  ClipboardList,
  ChevronDown,
  Wallet,
  PieChart,
  History,
  TrendingUp,
  FileBarChart,
  Building2,
  DollarSign,
  ScrollText,
  Layers,
  Calculator,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, labelKey: 'dashboard', href: '/dashboard' },
  { icon: Package, labelKey: 'inventory', href: '/inventory' },
  { icon: ShoppingCart, labelKey: 'pos', href: '/pos' },
  {
    icon: FileText,
    labelKey: 'sales',
    children: [
      { icon: FileText, labelKey: 'sales', href: '/sales' },
      { icon: ClipboardList, labelKey: 'returns', href: '/sales/returns' },
    ]
  },
  {
    icon: ShoppingCart,
    labelKey: 'purchases',
    children: [
      { icon: ShoppingCart, labelKey: 'purchases', href: '/purchases' },
      { icon: ClipboardList, labelKey: 'returns', href: '/purchases/returns' },
    ]
  },
  { icon: Users, labelKey: 'customers', href: '/customers' },
  { icon: Truck, labelKey: 'suppliers', href: '/suppliers' },
  {
    icon: Wallet,
    labelKey: 'accounting',
    children: [
      { icon: Building2, labelKey: 'accounts', href: '/accounting/accounts' },
      { icon: History, labelKey: 'journal', href: '/accounting/journal' },
      { icon: TrendingUp, labelKey: 'incomeStatement', href: '/accounting/income-statement' },
      { icon: FileBarChart, labelKey: 'balanceSheet', href: '/accounting/balance-sheet' },
      { icon: DollarSign, labelKey: 'cashFlow', href: '/accounting/cash-flow' },
      { icon: Layers, labelKey: 'consolidated', href: '/accounting/consolidated' },
      { icon: Calculator, labelKey: 'bank', href: '/accounting/bank' },
    ]
  },
  { icon: Receipt, labelKey: 'expenses', href: '/expense' },
  { icon: BarChart, labelKey: 'reports', href: '/reports' },
  { icon: ScrollText, labelKey: 'auditLogs', href: '/audit-logs', adminOnly: true },
  { icon: Bot, labelKey: 'aiChat', href: '/chatbot' },
  {
    icon: Settings,
    labelKey: 'settings',
    children: [
      { icon: Settings, labelKey: 'business', href: '/settings' },
      { icon: Building2, labelKey: 'branches', href: '/settings/branches', adminOnly: true },
      { icon: Users, labelKey: 'users', href: '/settings/users', adminOnly: true },
      { icon: Calculator, labelKey: 'taxRates', href: '/settings/tax-rates' },
    ]
  },
];

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href?: string;
  children?: NavItem[];
  adminOnly?: boolean;
}

const labelKeyMap: Record<string, { category: 'nav' | 'common'; key: string }> = {
  dashboard: { category: 'nav', key: 'dashboard' },
  inventory: { category: 'nav', key: 'inventory' },
  pos: { category: 'nav', key: 'pos' },
  sales: { category: 'common', key: 'sales' },
  returns: { category: 'common', key: 'returns' },
  purchases: { category: 'common', key: 'purchases' },
  customers: { category: 'common', key: 'customers' },
  suppliers: { category: 'nav', key: 'suppliers' },
  accounting: { category: 'common', key: 'accounting' },
  accounts: { category: 'common', key: 'accounts' },
  journal: { category: 'common', key: 'journal' },
  incomeStatement: { category: 'common', key: 'incomeStatement' },
  balanceSheet: { category: 'common', key: 'balanceSheet' },
  cashFlow: { category: 'common', key: 'cashFlow' },
  consolidated: { category: 'common', key: 'consolidated' },
  bank: { category: 'common', key: 'bank' },
  expenses: { category: 'nav', key: 'expenses' },
  reports: { category: 'nav', key: 'reports' },
  auditLogs: { category: 'common', key: 'auditLogs' },
  aiChat: { category: 'nav', key: 'chatbot' },
  settings: { category: 'nav', key: 'settings' },
  business: { category: 'common', key: 'business' },
  branches: { category: 'common', key: 'branches' },
  users: { category: 'common', key: 'users' },
  taxRates: { category: 'common', key: 'taxRates' },
};

const getLabel = (t: (category: 'nav' | 'common', key: string) => string, labelKey: string): string => {
  const mapping = labelKeyMap[labelKey];
  if (mapping) {
    return t(mapping.category, mapping.key);
  }
  return labelKey;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, t } = useAppStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.href!));
    }
    return false;
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const Icon = item.icon;
    const label = getLabel(t, item.labelKey);
    const active = isActive(item.href || '');
    const parentActive = item.children && isParentActive(item);

    if (item.children) {
      return (
        <div key={item.labelKey}>
          <button
            onClick={() => toggleDropdown(item.labelKey)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:translate-x-1 ${
              parentActive
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.labelKey ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === item.labelKey && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map(child => (
                <Link
                  key={child.href}
                  href={child.href!}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    isActive(child.href!)
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{getLabel(t, child.labelKey)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.adminOnly && user?.role !== 'ADMIN') {
      return null;
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:translate-x-1 ${
          active
            ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-100 dark:bg-slate-900 flex flex-col p-4 space-y-2 font-manrope text-sm font-medium">
      <div className="px-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-xl">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-indigo-700 dark:text-indigo-400">DUKA JANJA</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">POS System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(item => renderNavItem(item))}
      </nav>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>{t('nav', 'help')}</span>
        </Link>

        <Link
          href="/privacy-policy"
          className="flex items-center gap-3 px-3 py-4 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span>{t('help', 'privacyPolicy')}</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('auth', 'logout')}</span>
        </button>
      </div>
    </aside>
  );
}