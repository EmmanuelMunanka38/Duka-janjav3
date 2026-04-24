import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  vendor: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const data = updateExpenseSchema.parse(body);

    const expense = await prisma.expense.update({
      where: { id },
      data,
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Update expense error:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}