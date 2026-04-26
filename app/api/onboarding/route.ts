import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { business, branch, payments, categories, product, user } = body;

    await prisma.$transaction(async (tx) => {
      const branchData = await tx.branch.create({
        data: {
          name: branch.name || 'Main Branch',
          code: 'MAIN',
          location: branch.location,
          isMainBranch: true,
          status: 'active',
        },
      });

      for (const category of categories) {
        await tx.category.create({
          data: {
            name,
            userId,
          },
        });
      }

      for (const payment of payments) {
        await tx.paymentMethod.create({
          data: {
            name: payment.nameEn,
            nameSw: payment.nameSw,
            code: payment.id.toUpperCase(),
            enabled: true,
          },
        });
      }

      if (product.name) {
        await tx.product.create({
          data: {
            name: product.name,
            sku: product.sku || 'PROD-0001',
            barcode: `2${Date.now()}`,
            price: parseFloat(product.price) || 0,
            cost: parseFloat(product.cost) || 0,
            stock: parseInt(product.stock) || 0,
            lowStockThreshold: 5,
            userId,
            branchId: branchData.id,
          },
        });
      }

      if (user.name && user.email && user.password) {
        await tx.user.update({
          where: { id: userId },
          data: {
            name: user.name,
            email: user.email,
            onboardingComplete: true,
          },
        });
      }

      await tx.settings.upsert({
        where: { key: 'business_name' },
        update: { value: business.businessName },
        create: { key: 'business_name', value: business.businessName },
      });

      await tx.settings.upsert({
        where: { key: 'currency' },
        update: { value: business.currency },
        create: { key: 'currency', value: business.currency },
      });

      await tx.settings.upsert({
        where: { key: 'onboarding_complete' },
        update: { value: 'true' },
        create: { key: 'onboarding_complete', value: 'true' },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingComplete: true },
    });

    const branchCount = await prisma.branch.count();

    return NextResponse.json({
      needsOnboarding: !user?.onboardingComplete && branchCount === 0,
      completed: user?.onboardingComplete,
    });
  } catch (error) {
    console.error('Check onboarding error:', error);
    return NextResponse.json({ needsOnboarding: true });
  }
}