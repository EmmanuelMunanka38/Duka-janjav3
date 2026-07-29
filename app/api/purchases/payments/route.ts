import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchaseOrderId, amount, paymentMethod, reference, paymentDate, notes } = body;

    if (!purchaseOrderId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { payments: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paidAmount = existingOrder.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) + amount;
    
    if (paidAmount > existingOrder.totalAmount) {
      return NextResponse.json({ error: 'Payment exceeds remaining balance' }, { status: 400 });
    }

    const payment = await prisma.purchasePayment.create({
      data: {
        purchaseOrderId,
        amount,
        paymentMethod,
        reference: reference || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes || null,
      },
    });

    const newPaidAmount = paidAmount;
    let newStatus = existingOrder.status;
    
    if (newPaidAmount >= existingOrder.totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = existingOrder.status === 'invoiced' ? 'invoiced' : 'invoiced';
    }

    if (newStatus !== existingOrder.status) {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { paidAmount: newPaidAmount },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}