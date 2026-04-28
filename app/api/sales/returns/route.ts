import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const generateReturnNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const count = await prisma.saleReturn.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(24, 0, 0, 0)),
      },
    },
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `RET-${dateStr}-${sequence}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (startDate) {
      where.createdAt = {
        ...(where.createdAt as object || {}),
        gte: new Date(startDate),
      };
    }
    
    if (endDate) {
      where.createdAt = {
        ...(where.createdAt as object || {}),
        lte: new Date(endDate + 'T23:59:59'),
      };
    }

    const returns = await prisma.saleReturn.findMany({
      where,
      include: {
        sale: {
          include: {
            customer: true,
            branch: true,
            items: {
              include: { product: true },
            },
          },
        },
        processedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saleId, amount, reason, branchId } = body;

    if (!saleId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (amount > existingSale.totalAmount) {
      return NextResponse.json({ error: 'Return amount cannot exceed sale amount' }, { status: 400 });
    }

    const returnNumber = await generateReturnNumber();

    const saleReturn = await prisma.saleReturn.create({
      data: {
        returnNumber,
        saleId,
        branchId: branchId || existingSale.branchId,
        amount,
        reason,
        status: 'pending',
        items: {
          create: existingSale.items.map((item: { productId: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        sale: {
          include: { customer: true, items: { include: { product: true } } },
        },
      },
    });

    return NextResponse.json(saleReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, processedById, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existingReturn = await prisma.saleReturn.findUnique({
      where: { id },
      include: { sale: true },
    });

    if (!existingReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    const saleReturn = await prisma.saleReturn.update({
      where: { id },
      data: {
        status,
        ...(processedById && { processedById }),
        ...(notes && { notes }),
        ...(status === 'completed' && { processedAt: new Date() }),
      },
      include: {
        sale: {
          include: { customer: true, items: { include: { product: true } } },
        },
      },
    });

    if (status === 'completed') {
      const refundAmount = existingReturn.amount;
      await prisma.journalEntry.create({
        data: {
          date: new Date(),
          description: `Refund processed for ${existingReturn.sale.saleNumber}`,
          descriptionSw: `Rejesho limeendeshwa kwa ${existingReturn.sale.saleNumber}`,
          debitAccountId: (await prisma.account.findFirst({ where: { code: '5100' } }))?.id,
          creditAccountId: (await prisma.account.findFirst({ where: { code: '1100' } }))?.id,
          amount: refundAmount,
          reference: existingReturn.returnNumber,
          branchId: existingReturn.branchId,
          entryType: 'sales_return',
        },
      });
    }

    return NextResponse.json(saleReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 });
  }
}