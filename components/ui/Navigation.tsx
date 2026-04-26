'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, FileText, Users } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, labelEn: 'Dashboard', labelSw: 'Dashibodi' },
  { href: '/pos', icon: ShoppingCart, labelEn: 'POS', labelSw: 'POS' },
  { href: '/inventory', icon: Package, labelEn: 'Inventory', labelSw: 'Bidhaa' },
  { href: '/reports', icon: FileText, labelEn: 'Reports', labelSw: 'Ripoti' },
  { href: '/customers', icon: Users, labelEn: 'Customers', labelSw: 'Wateja' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-pb">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                isActive ? 'text-[#1D4ED8]' : 'text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#1D4ED8]' : ''}`} />
              <span>{item.labelEn}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', icon: Home, labelEn: 'Dashboard', labelSw: 'Dashibodi' },
    { href: '/pos', icon: ShoppingCart, labelEn: 'Point of Sale', labelSw: 'Nafasi ya Kuuza' },
    { href: '/inventory', icon: Package, labelEn: 'Inventory', labelSw: 'Bidhaa' },
    { href: '/expenses', icon: FileText, labelEn: 'Expenses', labelSw: 'Matumizi' },
    { href: '/customers', icon: Users, labelEn: 'Customers', labelSw: 'Wateja' },
    { href: '/suppliers', icon: Users, labelEn: 'Suppliers', labelSw: 'Muuzaji' },
    { href: '/reports', icon: FileText, labelEn: 'Reports', labelSw: 'Ripoti' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-lg">Duka Janja POS</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.labelEn}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}