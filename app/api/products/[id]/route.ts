import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { checkLowStockNotification } from '@/lib/notifications';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  nameSw: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  branchId: z.string().optional(),
  supplierId: z.string().optional(),
  unit: z.string().optional(),
  taxRate: z.number().optional(),
  isActive: z.boolean().optional(),
});

const adjustSchema = z.object({
  newQty: z.number().int().min(0),
  reason: z.enum(['count', 'damage', 'theft', 'error', 'other']),
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

const REASON_LABELS: Record<string, { en: string; sw: string }> = {
  count: { en: 'Stock Count', sw: 'Kuhesabu' },
  damage: { en: 'Damage', sw: 'Uharibifu' },
  theft: { en: 'Theft', sw: 'Wizi' },
  error: { en: 'Error', sw: 'Kosa' },
  other: { en: 'Other', sw: 'Nyingine' },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        category: true,
        stockHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { supplier: true, category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = adjustSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const previousQty = product.stock;
    const newQty = data.newQty;
    const qtyDiff = newQty - previousQty;

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: newQty },
    });

    await prisma.stockHistory.create({
      data: {
        productId: id,
        quantity: qtyDiff,
        previousQty,
        newQty,
        type: qtyDiff > 0 ? 'addition' : 'reduction',
        reason: REASON_LABELS[data.reason]?.en || data.reason,
        notes: data.notes || null,
        userId,
      },
    });

    await checkLowStockNotification(updated.id, updated.name, updated.stock, updated.lowStockThreshold);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Adjust stock error:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deactivate product error:', error);
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
}