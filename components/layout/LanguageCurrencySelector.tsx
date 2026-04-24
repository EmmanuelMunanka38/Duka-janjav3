'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { languages, currencies, LanguageCode, CurrencyCode } from '@/lib/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageCurrencySelector() {
  const { language, setLanguage, currency, setCurrency, t } = useAppStore();
  const [openDropdown, setOpenDropdown] = useState<'language' | 'currency' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages[language];
  const currentCurrency = currencies[currency];

  return (
    <div ref={dropdownRef} className="relative flex items-center gap-2">
      <button
        onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
        className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        title={t('settings', 'language')}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.flag || '🌐'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {openDropdown === 'language' && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
            {t('settings', 'language')}
          </div>
          {(Object.entries(languages) as [LanguageCode, typeof languages[LanguageCode]][]).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                language === code ? 'bg-primary/5 text-primary' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </div>
              {language === code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <span>{currentCurrency.symbol}</span>
        <span>{currency}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {openDropdown === 'currency' && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
            {t('settings', 'currency')}
          </div>
          {(Object.entries(currencies) as [CurrencyCode, typeof currencies[CurrencyCode]][]).map(([code, curr]) => (
            <button
              key={code}
              onClick={() => {
                setCurrency(code);
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                currency === code ? 'bg-primary/5 text-primary' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{curr.symbol}</span>
                <span>{curr.code}</span>
                <span className="text-slate-400 text-xs">- {curr.name}</span>
              </div>
              {currency === code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
