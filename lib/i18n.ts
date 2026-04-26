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
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    locale: 'en-TZ',
  },
} as const;

export type CurrencyCode = keyof typeof currencies;

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const currency = currencies[currencyCode];
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
