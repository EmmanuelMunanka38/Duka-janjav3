import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      include: {
        products: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = supplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
