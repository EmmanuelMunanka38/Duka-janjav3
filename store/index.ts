import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LanguageCode, CurrencyCode } from '@/lib/i18n';
import { translations, t as translate } from '@/lib/translations';

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  isMainBranch: boolean;
  status: string;
}

export interface CartItem {
  id: string;
  name: string;
  nameSw: string | null;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  taxRate: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number, discount?: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1, discount: 0 }] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      updateQuantity: (id, quantity, discount = 0) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity, discount } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'pos-cart',
    }
  )
);

interface AppStore {
  user: { id: string; name: string; email: string; role: string } | null;
  setUser: (user: AppStore['user']) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  t: (key: Parameters<typeof translate>[1], path: Parameters<typeof translate>[2]) => string;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      language: 'en',
      setLanguage: (language) => set({ language }),
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
      branches: [],
      setBranches: (branches) => set({ branches }),
      currentBranch: null,
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      t: (key, path) => translate(get().language, key, path),
    }),
    {
      name: 'pos-app',
    }
  )
);
