'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  labelSw?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyMessageSw?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  language?: 'sw' | 'en';
  getRowKey?: (item: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyMessageSw = 'Hakuna data inayopatikana',
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onSort,
  sortKey,
  sortDirection,
  language = 'sw',
  getRowKey = (_, i) => String(i),
}: DataTableProps<T>) {
  const isSwahili = language === 'sw';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    const key = String(col.key);
    const newDir = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDir);
  };

  if (loading) {
    return (
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header-row">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-left ${col.className || ''}`}>
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="table-row">
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header-row">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-left ${col.className || ''}`}>
                  <span className="table-header">{isSwahili ? (col.labelSw || col.label) : col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="1.5" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h6a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V7" />
          </svg>
          <p className="text-slate-500">{isSwahili ? emptyMessageSw : emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-container overflow-x-auto">
        <table className="w-full">
          <thead className="table-header-row">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left ${col.sortable ? 'cursor-pointer hover:bg-blue-50' : ''} ${col.className || ''}`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    <span className="table-header">{isSwahili ? (col.labelSw || col.label) : col.label}</span>
                    {col.sortable && onSort && sortKey === String(col.key) && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr
                key={getRowKey(item, rowIndex)}
                className={rowIndex % 2 === 0 ? 'table-row' : 'table-row-alt'}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && onPageChange && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-slate-500">
            {isSwahili ? 'Inaonyesha' : 'Showing'} {start}-{end} {isSwahili ? 'ya' : 'of'} {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-sm"
            >
              ←
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={end >= total}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-sm"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}