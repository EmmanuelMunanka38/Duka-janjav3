import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { generateAIResponse } from '@/lib/claude';

export async function GET() {
  try {
    const userId = await getUserId();
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    await prisma.chatMessage.create({
      data: {
        role: 'user',
        content,
        userId,
      },
    });

    const context = await buildContext();
    const response = await generateAIResponse(content, context);

    await prisma.chatMessage.create({
      data: {
        role: 'assistant',
        content: response,
        userId,
      },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

async function buildContext() {
  const now = new Date();
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const [todaySales, weeklySales, products, lowStock, outOfStock] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.product.count(),
    prisma.product.findMany({
      where: { 
        stock: { gt: 0, lte: 10 },
        isActive: true,
      },
      select: { name: true, stock: true, lowStockThreshold: true },
      take: 10,
    }),
    prisma.product.findMany({
      where: { stock: 0, isActive: true },
      select: { name: true, sku: true },
      take: 10,
    }),
  ]);

  const topProducts = await Promise.all(
    weeklySales.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });
      return product?.name;
    })
  );

  return {
    businessName: 'Duka Janja POS',
    currentDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    todaysSalesTotal: todaySales._sum.totalAmount || 0,
    todaysTransactions: todaySales._count,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.map(p => `${p.name} (${p.stock} left)`),
    outOfStockProducts: outOfStock.map(p => p.name),
    topProductsThisWeek: topProducts.filter((p): p is string => Boolean(p)),
    userName: user?.name || 'User',
    totalProducts: products,
  };
}