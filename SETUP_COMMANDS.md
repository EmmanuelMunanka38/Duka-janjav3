# 🚀 DUKA JANJA - COPY & PASTE SETUP COMMANDS

Habari! Hapa ni amri zote za kumfanya kazi kwa terminal. Just copy and paste each section! 

---

## ✅ STEP 1: Install All Dependencies

Copy and paste this in your terminal:

```bash
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers redis bull ioredis lucide-react recharts
```

Then wait for it to complete. ✓

---

## ✅ STEP 2: Update .env.local File

Open `.env.local` in your editor and replace EVERYTHING with this:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/duka_janja"
DIRECT_URL="postgresql://user:password@localhost:5432/duka_janja"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Authentication
JWT_SECRET="your-super-secret-key-min-32-chars-long-random-string-here-change-this"
NEXTAUTH_SECRET="another-super-secret-key-min-32-chars-long-random-change-this-too"
NEXTAUTH_URL="http://localhost:3000"

# Payment Gateways (Optional - add later)
PESAPAL_API_KEY=""
PESAPAL_API_SECRET=""
MPESA_CONSUMER_KEY=""
MPESA_CONSUMER_SECRET=""

# Email Service (Optional - add later)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="noreply@dukajanja.com"

# Monitoring (Optional - add later)
SENTRY_DSN=""
```

Save the file. ✓

---

## ✅ STEP 3: Create lib/config.ts File

Create a new file at `lib/config.ts` and paste this:

```typescript
export const config = {
  // Database
  DATABASE_POOL_SIZE: 20,
  DATABASE_TIMEOUT: 10000,

  // Cache
  CACHE_DEFAULT_TTL: 300, // 5 minutes
  CACHE_DASHBOARD_TTL: 300,
  CACHE_PRODUCTS_TTL: 3600,
  CACHE_REPORTS_TTL: 600,

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,

  // Performance
  MAX_REQUEST_SIZE: '10mb',
  REQUEST_TIMEOUT: 30000,

  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Features
  ENABLE_NOTIFICATIONS: true,
  ENABLE_PAYMENT_GATEWAYS: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
};

export const currencies = ['KES', 'TZS', 'UGX', 'USD', 'EUR'];
export const languages = ['en', 'sw'];
```

✓

---

## ✅ STEP 4: Create lib/redis.ts File

Create a new file at `lib/redis.ts` and paste this:

```typescript
import { createClient } from 'redis';

const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

(async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
})();

export default redis;
```

✓

---

## ✅ STEP 5: Create lib/cache.ts File

Create a new file at `lib/cache.ts` and paste this:

```typescript
import redis from './redis';

const PREFIXES = {
  USER: 'user',
  DASHBOARD: 'dashboard',
  BRANCH: 'branch',
  PRODUCT: 'product',
  SALES: 'sales',
  EXPENSE: 'expense',
};

export const cacheService = {
  // User cache
  async getUser(userId: string) {
    return redis.get(`${PREFIXES.USER}:${userId}`);
  },
  async setUser(userId: string, data: any, ttl = 1800) {
    await redis.setEx(`${PREFIXES.USER}:${userId}`, ttl, JSON.stringify(data));
  },
  async invalidateUser(userId: string) {
    await redis.del(`${PREFIXES.USER}:${userId}`);
  },

  // Dashboard cache
  async getDashboard(branchId: string) {
    const data = await redis.get(`${PREFIXES.DASHBOARD}:${branchId}`);
    return data ? JSON.parse(data) : null;
  },
  async setDashboard(branchId: string, data: any, ttl = 300) {
    await redis.setEx(`${PREFIXES.DASHBOARD}:${branchId}`, ttl, JSON.stringify(data));
  },
  async invalidateDashboard(branchId: string) {
    await redis.del(`${PREFIXES.DASHBOARD}:${branchId}`);
  },

  // Product cache
  async getProducts(branchId: string, page = 1) {
    const data = await redis.get(`${PREFIXES.PRODUCT}:${branchId}:${page}`);
    return data ? JSON.parse(data) : null;
  },
  async setProducts(branchId: string, page: number, data: any, ttl = 3600) {
    await redis.setEx(`${PREFIXES.PRODUCT}:${branchId}:${page}`, ttl, JSON.stringify(data));
  },
  async invalidateProducts(branchId: string) {
    const keys = await redis.keys(`${PREFIXES.PRODUCT}:${branchId}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },

  // Clear all cache
  async invalidateAll() {
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },
};

export default cacheService;
```

✓

---

## ✅ STEP 6: Update store/index.ts File

Open `store/index.ts` and replace EVERYTHING with this:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  user: any | null;
  setUser: (user: any) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'en' | 'sw';
  setLanguage: (lang: 'en' | 'sw') => void;
  currency: string;
  setCurrency: (currency: string) => void;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      currency: 'KES',
      setCurrency: (currency) => set({ currency }),
      selectedBranch: 'all',
      setSelectedBranch: (branchId) => set({ selectedBranch: branchId }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        selectedBranch: state.selectedBranch,
      }),
    }
  )
);
```

✓

---

## ✅ STEP 7: Create API Routes - Branches

Create file at `app/api/branches/route.ts` and paste this:

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import cacheService from '@/lib/cache';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  manager: z.string().max(100).optional(),
  isMainBranch: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        name: true,
        location: true,
        manager: true,
        phone: true,
        email: true,
        isMainBranch: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ isMainBranch: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('GET /api/branches error:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = branchSchema.parse(body);

    if (data.isMainBranch) {
      await prisma.branch.updateMany({
        where: { userId: session.userId, isMainBranch: true },
        data: { isMainBranch: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        ...data,
        userId: session.userId,
      },
    });

    await cacheService.invalidateAll();

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('POST /api/branches error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 });
    }

    const branch = await prisma.branch.update({
      where: { id, userId: session.userId },
      data,
    });

    await cacheService.invalidateAll();

    return NextResponse.json(branch);
  } catch (error) {
    console.error('PUT /api/branches error:', error);
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 });
    }

    await prisma.branch.delete({
      where: { id, userId: session.userId },
    });

    await cacheService.invalidateAll();

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/branches error:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
```

✓

---

## ✅ STEP 8: Create API Routes - Payment Methods

Create file at `app/api/payment-methods/route.ts` and paste this:

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const paymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'card', 'mpesa', 'pesapal', 'bank', 'cheque']),
  gatewayKey: z.string().max(500).optional(),
  gatewaySecret: z.string().max(500).optional(),
  commission: z.number().min(0).max(100).default(0),
  isEnabled: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        name: true,
        type: true,
        commission: true,
        isEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(methods);
  } catch (error) {
    console.error('GET /api/payment-methods error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = paymentMethodSchema.parse(body);

    const method = await prisma.paymentMethod.create({
      data: {
        ...data,
        userId: session.userId,
      },
    });

    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error('POST /api/payment-methods error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}
```

✓

---

## ✅ STEP 9: Create API Routes - Accounting Income Statement

Create file at `app/api/accounting/income-statement/route.ts` and paste this:

```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import cacheService from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch') || 'all';
    const period = searchParams.get('period') || 'month';

    // Check cache
    const cached = await cacheService.getDashboard(branchId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    if (period === 'month') {
      startDate.setDate(1);
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Build where clause
    const whereClause: any = {
      createdAt: { gte: startDate, lte: now },
    };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    // Fetch sales data
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: { items: true },
    });

    const expenses = await prisma.expense.findMany({
      where: whereClause,
    });

    // Calculate metrics
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const costOfGoodsSold = sales.reduce((sum, s) => {
      const itemCost = s.items.reduce((itemSum, item) => {
        return itemSum + (item.totalPrice * 0.6);
      }, 0);
      return sum + itemCost;
    }, 0);

    const grossProfit = totalRevenue - costOfGoodsSold;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const operatingExpenses = {
      rent: expensesByCategory['rent'] || 0,
      salaries: expensesByCategory['salaries'] || 0,
      utilities: expensesByCategory['utilities'] || 0,
      marketing: expensesByCategory['marketing'] || 0,
      other: 0,
    };

    const totalOperatingExpenses = Object.values(operatingExpenses).reduce((sum: number, val: any) => sum + val, 0);
    const netProfit = grossProfit - totalOperatingExpenses;

    const result = {
      period: `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      totalRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      totalOperatingExpenses,
      netProfit,
      profitMargin,
    };

    // Cache for 10 minutes
    await cacheService.setDashboard(branchId, result, 600);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Income statement error:', error);
    return NextResponse.json({ error: 'Failed to calculate income statement' }, { status: 500 });
  }
}
```

✓

---

## ✅ STEP 10: Create Branch Selector Component

Create file at `components/layout/BranchSelector.tsx` and paste this:

```typescript
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store';
import { ChevronDown, Plus, MapPin } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location?: string;
  isMainBranch: boolean;
}

export default function BranchSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedBranch, setSelectedBranch } = useAppStore();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json() as Promise<Branch[]>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentBranch = selectedBranch === 'all' 
    ? { name: '📊 All Branches', id: 'all', isMainBranch: false }
    : branches.find(b => b.id === selectedBranch) || branches[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        <MapPin className="w-4 h-4" />
        <span>{currentBranch?.name || 'Select Branch'}</span>
        <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-blue-200 z-50">
          <button
            onClick={() => {
              setSelectedBranch('all');
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
              selectedBranch === 'all' ? 'bg-blue-100 border-l-4 border-blue-600' : ''
            }`}
          >
            <span className="font-medium text-blue-900">📊 All Branches</span>
            <p className="text-xs text-blue-600">Jumla ya dukani zote</p>
          </button>

          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => {
                setSelectedBranch(branch.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                selectedBranch === branch.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
              }`}
            >
              <span className="font-medium text-blue-900">{branch.name}</span>
              {branch.location && (
                <p className="text-xs text-blue-600">{branch.location}</p>
              )}
            </button>
          ))}

          <div className="border-t border-blue-100"></div>

          <a
            href="/settings?tab=branches"
            className="flex items-center gap-2 px-4 py-3 hover:bg-green-50 text-green-600 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">+ Ongeza Duka</span>
          </a>
        </div>
      )}
    </div>
  );
}
```

✓

---

## ✅ STEP 11: Generate Prisma Client

Copy and paste this in terminal:

```bash
npx prisma generate
```

Wait for it to complete. ✓

---

## ✅ STEP 12: Run Database Migrations

Copy and paste this in terminal:

```bash
npx prisma migrate dev --name add_branches_payments_accounting
```

It will ask you questions - just press Enter or type `yes` when prompted. ✓

---

## ✅ STEP 13: Start Development Server

Copy and paste this in terminal:

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

Open http://localhost:3000 in your browser ✓

---

## 🎉 DONE!

Your Duka Janja is now running with:
- ✅ Branch system (multi-store support)
- ✅ Payment methods configuration
- ✅ Caching & performance optimization
- ✅ API routes for accounting
- ✅ Complete frontend components

### Next Steps:

1. **Add Settings Page** → Go to `/settings`
2. **Create Branches** → Click "Ongeza Duka"
3. **Configure Payment Methods** → Settings > Payment Methods
4. **View Income Statement** → Accounting > Income Statement
5. **Monitor Performance** → Everything is cached!

---

## 📞 DEBUGGING

If you get errors, try:

```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database
npx prisma migrate reset

# Start fresh
npm run dev
```

---

**Karibu! Welcome to Duka Janja!** 🚀
