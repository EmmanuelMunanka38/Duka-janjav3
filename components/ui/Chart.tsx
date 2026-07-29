'use client';

import { ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface ChartProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export function ChartContainer({ children, height = 300, className = '' }: ChartProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  language?: 'sw' | 'en';
  currency?: string;
  prefix?: string;
}

export function ChartTooltip({ active, payload, language = 'sw', currency = 'TZS', prefix }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  const isSwahili = language === 'sw';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-medium">
            {prefix || (currency === 'USD' ? '$' : 'TSh')} {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ChartLegendProps {
  language?: 'sw' | 'en';
}

export function ChartLegend({ language = 'sw' }: ChartLegendProps) {
  return (
    <Legend
      wrapperStyle={{
        paddingTop: '16px',
        fontSize: '13px',
        color: '#6B7280',
      }}
    />
  );
}

export const COLORS = {
  primary: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryLighter: '#60A5FA',
  profit: '#16A34A',
  profitLight: '#22C55E',
  loss: '#DC2626',
  lossLight: '#EF4444',
  warning: '#D97706',
  warningLight: '#F59E0B',
  neutral: '#6B7280',
  neutralLight: '#9CA3AF',
};

export const BAR_COLORS = [
  COLORS.primary,
  COLORS.primaryLight,
  COLORS.primaryLighter,
  COLORS.profit,
  COLORS.warning,
];

export const LINE_COLORS = {
  revenue: COLORS.profit,
  expenses: COLORS.loss,
  profit: COLORS.primary,
  previous: COLORS.neutral,
};