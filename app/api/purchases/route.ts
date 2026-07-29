import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const generateOrderNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const count = await prisma.purchaseOrder.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(24, 0, 0, 0)),
      },
    },
  });
  const sequence = String(count + 1).padStart(4, '0');
  return `PO-${dateStr}-${sequence}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (status && status !== 'all') where.status = status;
    if (supplierId && supplierId !== 'all') where.supplierId = supplierId;
    
    if (startDate) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(endDate + 'T23:59:59') };
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
        payments: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedOrders = orders.map((order: { supplier: unknown }) => {
      return { ...order, supplier: order.supplier };
    });

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, branchId, expectedDate, notes, items, userId, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const orderNumber = await generateOrderNumber();
    const totalAmount = items?.reduce((sum: number, item: { totalCost: number }) => sum + item.totalCost, 0) || 0;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: supplierId || '',
        branchId: branchId || null,
        status: status || 'draft',
        totalAmount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        createdBy: userId,
        items: items ? {
          create: items.map((item: { productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })),
        } : undefined,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, supplierId, branchId, expectedDate, notes, items, userId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const validStatuses = ['draft', 'ordered', 'received', 'invoiced', 'paid', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let totalAmount = existingOrder.totalAmount;
    if (items) {
      totalAmount = items.reduce((sum: number, item: { totalCost: number }) => sum + item.totalCost, 0);
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(supplierId && { supplierId }),
        ...(branchId !== undefined && { branchId }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(items && { totalAmount }),
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (items) {
      await prisma.purchaseItem.deleteMany({ where: { purchaseOrderId: id } });
      await prisma.purchaseItem.createMany({
        data: items.map((item: { productId: string; productName: string; quantity: number; unitCost: number; totalCost: number }) => ({
          purchaseOrderId: id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
        })),
      });
    }

    if (status === 'received') {
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
  }
}