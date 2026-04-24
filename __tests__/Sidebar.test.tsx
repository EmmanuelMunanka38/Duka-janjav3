import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

jest.mock('@/store', () => ({
  useAppStore: () => ({
    user: { id: 'u1', name: 'Bob', role: 'USER' },
    setUser: jest.fn(),
    t: (namespace: string, key: string) => key,
    language: 'en',
    currency: 'USD',
    setLanguage: jest.fn(),
    setCurrency: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Sidebar', () => {
  test('renders header and hides admin-only items for non-admin', () => {
    render(<Sidebar />);
    expect(screen.getByText(/DUKA JANJA/i)).toBeInTheDocument();
    // admin-only 'auditLogs' should not be visible for USER role
    expect(screen.queryByText('auditLogs')).toBeNull();
  });

  test('toggles child items when parent clicked', () => {
    render(<Sidebar />);
    const salesButton = screen.getAllByText('sales')[0];
    fireEvent.click(salesButton);
    expect(screen.getByText('returns')).toBeInTheDocument();
  });
});
