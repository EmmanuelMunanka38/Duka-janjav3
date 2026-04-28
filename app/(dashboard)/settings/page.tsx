'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '@/store';
import { Settings, Sun, Moon } from 'lucide-react';

interface Settings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  theme: 'light' | 'dark';
}

export default function SettingsPage() {
  const { theme, setTheme, t } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm<Settings>({
    defaultValues: {
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
      theme: 'light',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        reset(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Settings) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(t('messages', 'saveError'));
      }

      setTheme(data.theme as 'light' | 'dark');
      setMessage({ type: 'success', text: t('settings', 'settingsSaved') });
    } catch (err) {
      setMessage({ type: 'error', text: t('messages', 'saveError') });
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = watch('theme');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-600" />
            <div>
            <h1 className="font-bold text-xl text-slate-800">{t('settings', 'title')}</h1>
            <p className="text-xs text-slate-500">{t('settings', 'businessInfo')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">{t('settings', 'businessInfo')}</h2>
            <p className="text-sm text-slate-500">{t('settings', 'businessInfo')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings', 'businessName')}</label>
              <input
                {...register('businessName')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder={t('settings', 'businessName')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings', 'businessEmail')}</label>
                <input
                  {...register('businessEmail')}
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings', 'businessPhone')}</label>
                <input
                  {...register('businessPhone')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('settings', 'businessAddress')}</label>
              <textarea
                {...register('businessAddress')}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder={t('settings', 'businessAddress')}
              />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">{t('settings', 'appearance')}</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue('theme', 'light')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    currentTheme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-6 h-6 mb-2 mx-auto" />
                  <span className="text-sm font-medium">{t('settings', 'lightMode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('theme', 'dark')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    currentTheme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-6 h-6 mb-2 mx-auto" />
                  <span className="text-sm font-medium">{t('settings', 'darkMode')}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? t('common', 'loading') : t('settings', 'saveSettings')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
