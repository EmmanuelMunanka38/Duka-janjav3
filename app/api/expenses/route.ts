import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
  vendor: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    
    if (category && category !== 'All') {
      where.category = category;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.date as Record<string, Date>).lte = end;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        creator: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
