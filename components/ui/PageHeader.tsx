'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, RefreshCw, HelpCircle } from 'lucide-react';
import { useAppStore } from '@/store';

interface PageHeaderProps {
  title: string;
  titleSw: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchPlaceholderSw?: string;
  onSearch?: (query: string) => void;
  showExport?: boolean;
  showPrint?: boolean;
  onExport?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  helpLink?: string;
}

export default function PageHeader({
  title,
  titleSw,
  icon,
  actions,
  showSearch = true,
  searchPlaceholder = 'Search...',
  searchPlaceholderSw = 'Tafuta...',
  onSearch,
  showExport = false,
  showPrint = false,
  onExport,
  onPrint,
  onRefresh,
  helpLink,
}: PageHeaderProps) {
  const { language, currentBranch } = useAppStore();
  const isSwahili = language === 'sw';
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[#1D4ED8]">{icon}</div>}
          <div>
            <h1 className="page-title">{isSwahili ? titleSw : title}</h1>
            {currentBranch && (
              <p className="muted-text">{currentBranch.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {showSearch && onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSwahili ? searchPlaceholderSw : searchPlaceholder}
                className="input-field pl-10 w-48 md:w-64"
              />
            </div>
          )}

          {actions}

          {onRefresh && (
            <button onClick={onRefresh} className="btn-outline p-2" title={isSwahili ? 'Sasisha' : 'Refresh'}>
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {showExport && (
            <button onClick={onExport} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">{isSwahili ? 'Shepura' : 'Export'}</span>
            </button>
          )}

          {showPrint && (
            <button onClick={onPrint} className="btn-outline flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">{isSwahili ? 'Chapisha' : 'Print'}</span>
            </button>
          )}

          {helpLink && (
            <a href={helpLink} className="btn-outline p-2" title={isSwahili ? 'Musaada' : 'Help'}>
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}