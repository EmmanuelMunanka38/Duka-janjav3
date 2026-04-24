import { formatCurrency } from '@/lib/i18n';

describe('formatCurrency', () => {
  test('formats USD correctly', () => {
    const out = formatCurrency(1234.5, 'USD');
    expect(out).toMatch(/\$|USD/);
    expect(out).toMatch(/1,234/);
  });

  test('formats JPY without fraction digits', () => {
    const out = formatCurrency(1234, 'JPY');
    // JPY shouldn't have decimals
    expect(out).not.toMatch(/\./);
    expect(out).toMatch(/¥|JPY/);
  });
});
