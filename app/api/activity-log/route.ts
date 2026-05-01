import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const actionUserId = searchParams.get('userId');
    const actionType = searchParams.get('actionType');
    const recordType = searchParams.get('recordType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Record<string, unknown> = {};

    if (actionUserId) where.userId = actionUserId;
    if (actionType) where.action = actionType;
    if (recordType) where.recordType = recordType;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        branch: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await prisma.activityLog.count({ where });

    return NextResponse.json({ activities, total });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, recordType, recordId, details, oldValues, newValues, branchId } = body;

    const userId = await getUserId();

    const log = await prisma.activityLog.create({
      data: {
        action,
        recordType,
        recordId,
        details: details || '',
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId,
        branchId,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Create activity log error:', error);
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}