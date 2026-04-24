import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageCurrencySelector from '@/components/layout/LanguageCurrencySelector';
import { languages } from '@/lib/i18n';

const setLang = jest.fn();
const setCurr = jest.fn();

jest.mock('@/store', () => ({
  useAppStore: () => ({
    language: 'en',
    setLanguage: setLang,
    currency: 'USD',
    setCurrency: setCurr,
    t: (namespace: string, key: string) => key,
  }),
}));

describe('LanguageCurrencySelector', () => {
  test('opens language dropdown and selects language', () => {
    render(<LanguageCurrencySelector />);
    const langButton = screen.getByTitle('language');
    fireEvent.click(langButton);
    expect(screen.getByText(languages.en.nativeName)).toBeInTheDocument();
    fireEvent.click(screen.getByText(languages.en.nativeName));
    expect(setLang).toHaveBeenCalledWith('en');
  });

  test('opens currency dropdown and selects currency', () => {
    render(<LanguageCurrencySelector />);
    const currToggle = screen.getByText('USD');
    fireEvent.click(currToggle);
    const currText = screen.getByText(/US Dollar/);
    expect(currText).toBeInTheDocument();
    const currButton = currText.closest('button');
    expect(currButton).not.toBeNull();
    fireEvent.click(currButton!);
    expect(setCurr).toHaveBeenCalledWith('USD');
  });
});
