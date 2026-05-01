import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { checkLowStockNotification } from '@/lib/notifications';

const productSchema = z.object({
  name: z.string().min(1),
  nameSw: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  branchId: z.string().optional(),
  supplierId: z.string().optional(),
  unit: z.string().optional(),
  taxRate: z.number().optional(),
  isActive: z.boolean().optional(),
});

const adjustStockSchema = z.object({
  productId: z.string(),
  newQty: z.number().int().min(0),
  reason: z.enum(['count', 'damage', 'theft', 'error', 'other']),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  productId: z.string(),
  fromBranchId: z.string(),
  toBranchId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const generateSKU = async (categoryPrefix?: string) => {
  const prefix = categoryPrefix || 'PROD';
  const count = await prisma.product.count({
    where: { sku: { startsWith: prefix } },
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
};

const generateBarcode = () => {
  return `2${String(Date.now()).slice(-12)}`;
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');
    const stockStatus = searchParams.get('stockStatus');

    const where: Record<string, unknown> = {};

    if (category && category !== 'All') {
      where.category = category;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (lowStock === 'true') {
      where.stock = { lte: prisma.product.fields.lowStockThreshold };
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (stockStatus) {
      if (stockStatus === 'out') {
        where.stock = 0;
      } else if (stockStatus === 'low') {
        where.AND = [
          { stock: { gt: 0 } },
          { stock: { lte: prisma.product.fields.lowStockThreshold } },
        ];
      } else if (stockStatus === 'normal') {
        where.stock = { gt: prisma.product.fields.lowStockThreshold };
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = productSchema.parse(body);

    if (data.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    } else {
      data.sku = await generateSKU(data.categoryId);
    }

    if (!data.barcode) {
      data.barcode = generateBarcode();
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        lowStockThreshold: data.lowStockThreshold || 5,
        createdBy: userId,
      },
      include: {
        supplier: true,
        category: true,
      },
    });

    if (data.stock > 0) {
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          quantity: data.stock,
          previousQty: 0,
          newQty: data.stock,
          type: 'initial',
          reason: 'Initial stock',
          userId,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds, isActive } = body;

    if (productIds && Array.isArray(productIds)) {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 });
  }
}