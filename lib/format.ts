import { LanguageCode } from './i18n';

export function formatCurrency(amount: number, currency: string = 'TZS', lang: LanguageCode = 'sw'): string {
  const symbols: Record<string, string> = {
    TZS: 'TSh',
    USD: '$',
  };
  
  const symbol = symbols[currency] || currency;
  const formatted = Math.abs(amount).toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });
  
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${symbol} ${formatted}`;
}

export function formatNumber(num: number, lang: LanguageCode = 'sw'): string {
  return num.toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-US');
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short', lang: LanguageCode = 'sw'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'iso') {
    return d.toISOString().split('T')[0];
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'long') {
    return d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return `${day}/${month}/${year}`;
}

export function formatTime(date: Date | string, use24Hour: boolean = true, lang: LanguageCode = 'sw'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  if (use24Hour) {
    return `${hours}:${minutes}`;
  }
  
  const h = d.getHours();
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

export function formatDateTime(date: Date | string, lang: LanguageCode = 'sw'): string {
  return `${formatDate(date, 'short', lang)} ${formatTime(date, true, lang)}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatCompactNumber(num: number, lang: LanguageCode = 'sw'): string {
  const locales: Record<LanguageCode, string> = {
    sw: 'sw-TZ',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-PT',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ar: 'ar-SA',
  };
  
  return new Intl.NumberFormat(locales[lang], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function getCurrencySymbol(currency: string): string {
  return currency === 'USD' ? '$' : 'TSh';
}

export function getCurrencyCode(currency: string): string {
  return currency.toUpperCase();
}