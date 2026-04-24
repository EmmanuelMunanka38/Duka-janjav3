import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  paymentMethod: z.string().min(1),
  paidAmount: z.number().min(0),
  customerName: z.string().optional(),
  customerContact: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Prisma.SaleWhereInput = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        creator: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createSaleSchema.parse(body);

    const saleNumber = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const change = data.paidAmount - totalAmount;

    if (change < 0) {
      return NextResponse.json({ error: 'Insufficient payment' }, { status: 400 });
    }

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        }, { status: 400 });
      }
    }

    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          totalAmount,
          paidAmount: data.paidAmount,
          change,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerContact: data.customerContact,
          status: 'completed',
          createdBy: userId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create sale error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
