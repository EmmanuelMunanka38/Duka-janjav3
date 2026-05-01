import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const generateReturnNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const count = await prisma.purchaseReturn.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(24, 0, 0, 0)),
      },
    },
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `DN-${dateStr}-${sequence}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    
    if (supplierId && supplierId !== 'all') where.supplierId = supplierId;
    if (status && status !== 'all') where.status = status;
    
    if (startDate) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(endDate + 'T23:59:59') };
    }

    const returns = await prisma.purchaseReturn.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalOrderId, supplierId, amount, reason, notes, userId, items } = body;

    if (!userId || !supplierId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const returnNumber = await generateReturnNumber();

    const purchaseReturn = await prisma.purchaseReturn.create({
      data: {
        returnNumber,
        originalOrderId: originalOrderId || '',
        supplierId,
        amount,
        reason,
        status: 'pending',
        notes: notes || null,
        userId,
        items: items ? {
          create: items.map((item: { productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })),
        } : undefined,
      },
      include: {
        items: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(purchaseReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase return:', error);
    return NextResponse.json({ error: 'Failed to create purchase return' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Return ID required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existingReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: { items: true, originalOrder: true },
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const updatedReturn = await prisma.purchaseReturn.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        items: true,
        user: { select: { name: true } },
      },
    });

    if (status === 'completed') {
      for (const item of existingReturn.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      
      await prisma.supplier.update({
        where: { id: existingReturn.supplierId },
        data: { creditBalance: { increment: existingReturn.amount } },
      });
      
      await prisma.journalEntry.create({
        data: {
          date: new Date(),
          description: `Debit Note ${existingReturn.returnNumber} processed`,
          descriptionSw: `Hati ya Debiti ${existingReturn.returnNumber} imesindikwa`,
          debitAccountId: (await prisma.account.findFirst({ where: { code: '2100' } }))?.id,
          creditAccountId: (await prisma.account.findFirst({ where: { code: '1100' } }))?.id,
          amount: existingReturn.amount,
          reference: existingReturn.returnNumber,
          entryType: 'supplier_return',
        },
      });
    }

    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error('Error updating purchase return:', error);
    return NextResponse.json({ error: 'Failed to update purchase return' }, { status: 500 });
  }
}