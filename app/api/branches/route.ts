import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  manager: z.string().optional(),
  isMainBranch: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = branchSchema.parse(body);

    const existingBranches = await prisma.branch.count({
      where: { userId },
    });
    const branchCode = `BR-${String(existingBranches + 1).padStart(3, '0')}`;

    const branch = await prisma.branch.create({
      data: {
        ...data,
        code: branchCode,
        userId,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Create branch error:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}