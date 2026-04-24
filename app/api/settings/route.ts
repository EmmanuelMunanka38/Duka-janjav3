import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

const settingsSchema = z.object({
  businessName: z.string().min(1).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.businessSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          userId,
          businessName: 'Duka Janja POS',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = settingsSchema.parse(body);

    let settings = await prisma.businessSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          userId,
          ...data,
        },
      });
    } else {
      settings = await prisma.businessSettings.update({
        where: { userId },
        data,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
