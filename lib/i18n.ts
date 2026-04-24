export const languages = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  sw: {
    name: 'Swahili',
    nativeName: 'Kiswahili',
    flag: '🇰🇪',
  },
} as const;

export type LanguageCode = keyof typeof languages;

export const currencies = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    locale: 'zh-CN',
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    locale: 'en-KE',
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    locale: 'en-TZ',
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    locale: 'en-UG',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    locale: 'pt-BR',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    locale: 'es-MX',
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    locale: 'ar-SA',
  },
} as const;

export type CurrencyCode = keyof typeof currencies;

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const currency = currencies[currencyCode];
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
}
