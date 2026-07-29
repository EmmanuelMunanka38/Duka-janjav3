import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { checkLowStockNotification } from '@/lib/notifications';

const transferSchema = z.object({
  productId: z.string(),
  fromBranchId: z.string(),
  toBranchId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = transferSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (data.quantity > product.stock) {
      return NextResponse.json({ error: 'Insufficient stock at source branch' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: data.productId },
      data: { stock: { decrement: data.quantity } },
    });

    await checkLowStockNotification(updated.id, updated.name, updated.stock, updated.lowStockThreshold, userId);

    await prisma.stockHistory.create({
      data: {
        productId: data.productId,
        quantity: -data.quantity,
        previousQty: product.stock,
        newQty: product.stock - data.quantity,
        type: 'transfer_out',
        reason: `Transfer to branch ${data.toBranchId}`,
        reference: data.fromBranchId,
        notes: data.notes || null,
        branchId: data.fromBranchId,
        userId,
      },
    });

    if (data.toBranchId !== data.fromBranchId) {
      const existingAtDest = await prisma.product.findFirst({
        where: { 
          id: data.productId,
          branchId: data.toBranchId,
        },
      });

      if (existingAtDest) {
        await prisma.product.update({
          where: { id: data.productId },
          data: { stock: { increment: data.quantity } },
        });
      }

      await prisma.stockHistory.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          previousQty: 0,
          newQty: data.quantity,
          type: 'transfer_in',
          reason: `Transfer from branch ${data.fromBranchId}`,
          reference: data.toBranchId,
          notes: data.notes || null,
          branchId: data.toBranchId,
          userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer stock' }, { status: 500 });
  }
}