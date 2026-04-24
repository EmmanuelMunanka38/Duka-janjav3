'use client';

import TopNav from '@/components/layout/TopNav';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function AuditLogsPage() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <>
      <TopNav />
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Kumbukumbu za Ukaguzi</h1>
        </div>
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Ukurasa wa kumbukumbu za ukaguzi utakuja hapa</p>
        </div>
      </div>
    </>
  );
}