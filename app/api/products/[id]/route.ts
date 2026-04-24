import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  category: z.string().optional(),
  supplierId: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      include: { supplier: true },
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const relatedSaleItems = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (relatedSaleItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with associated sales records. Consider marking it as discontinued instead.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}