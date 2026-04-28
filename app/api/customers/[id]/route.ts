import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.number().optional(),
  isActive: z.boolean().optional(),
  creditBalance: z.number().optional(),
});

const CREDIT_LABELS: Record<string, { en: string; sw: string }> = {
  credit_sale: { en: 'Credit Sale', sw: 'Kununua Kikopo' },
  credit_payment: { en: 'Credit Payment', sw: 'Kulipa Kikopo' },
  adjustment: { en: 'Adjustment', sw: 'Kurekebisha' },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...customer,
      isActive: true,
      createdAt: customer.createdAt.toISOString(),
      creditBalance: customer.creditBalance || 0,
      creditLimit: customer.creditLimit || 0,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
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
    const data = updateSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.creditBalance !== undefined && { creditBalance: data.creditBalance }),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.update({
      where: { id },
      data: { address: '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deactivate customer error:', error);
    return NextResponse.json({ error: 'Failed to deactivate customer' }, { status: 500 });
  }
}