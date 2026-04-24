import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  category: z.string().optional(),
  supplierId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');

    const where: Record<string, unknown> = {};
    
    if (category && category !== 'All') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    
    if (lowStock === 'true') {
      where.OR = [
        { ...where, stock: { lte: 5 } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = productSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        lowStockThreshold: data.lowStockThreshold || 5,
        createdBy: userId,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
