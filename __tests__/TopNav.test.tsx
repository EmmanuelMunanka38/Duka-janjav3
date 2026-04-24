import React from 'react';
import { render, screen } from '@testing-library/react';
import TopNav from '@/components/layout/TopNav';

jest.mock('@/store', () => ({
  useAppStore: () => ({
    user: { name: 'Alice' },
    setUser: jest.fn(),
    t: (namespace: string, key: string) => key,
    language: 'en',
    currency: 'USD',
    setLanguage: jest.fn(),
    setCurrency: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('TopNav', () => {
  test('renders title and user', () => {
    render(<TopNav />);
    expect(screen.getByText(/Duka Janja POS/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
