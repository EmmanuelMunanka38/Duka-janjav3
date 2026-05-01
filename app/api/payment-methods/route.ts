import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const paymentMethodSchema = z.object({
  name: z.string().min(1),
  nameSw: z.string().optional(),
  type: z.string(),
  code: z.string().min(1),
  hasReference: z.boolean().optional(),
  referenceLabel: z.string().optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });

    if (methods.length === 0) {
      const defaults = [
        { name: 'Cash', nameSw: 'Pesa Taslimu', code: 'cash', type: 'cash', hasReference: false, sortOrder: 1, isEnabled: true },
        { name: 'Card', nameSw: 'Kadi', code: 'card', type: 'card', hasReference: false, sortOrder: 2, isEnabled: true },
        { name: 'Mobile Money', nameSw: 'Simu', code: 'mobile', type: 'mobile', hasReference: true, referenceLabel: 'M-PESA No', sortOrder: 3, isEnabled: true },
        { name: 'Bank Transfer', nameSw: 'Benki', code: 'bank', type: 'bank', hasReference: true, referenceLabel: 'Bank Ref No', sortOrder: 4, isEnabled: true },
        { name: 'Cheque', nameSw: 'Cheque', code: 'cheque', type: 'cheque', hasReference: true, referenceLabel: 'Cheque No', sortOrder: 5, isEnabled: true },
        { name: 'Credit', nameSw: 'Mikopo', code: 'credit', type: 'credit', hasReference: false, sortOrder: 6, isEnabled: true },
      ];
      
      for (const method of defaults) {
        await prisma.paymentMethod.create({
          data: { ...method, userId },
        });
      }
      
      return NextResponse.json(defaults);
    }

    return NextResponse.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = paymentMethodSchema.parse(body);

    const existingCode = await prisma.paymentMethod.findFirst({
      where: { code: data.code, userId },
    });

    if (existingCode) {
      return NextResponse.json({ error: 'Payment method code already exists' }, { status: 400 });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        ...data,
        userId,
      },
    });

    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create payment method error:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}