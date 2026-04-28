'use client';

interface SkeletonProps {
  type?: 'text' | 'card' | 'table' | 'chart';
  lines?: number;
  className?: string;
}

export function Skeleton({ type = 'text', lines = 3, className = '' }: SkeletonProps) {
  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${100 - (i * 15)}%` }}></div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-100 rounded animate-pulse w-2/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="bg-[#EFF6FF] p-4">
          <div className="h-4 bg-slate-200/50 rounded animate-pulse w-1/4"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-100">
            <div className="flex gap-4">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3 mb-6"></div>
        <div className="h-64 flex items-end gap-2">
          {[40, 60, 45, 80, 55, 70, 50, 65, 75, 45].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-200 rounded-t animate-pulse" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="h-4 bg-slate-200 rounded animate-pulse" />;
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} type="card" />
      ))}
    </div>
  );
}