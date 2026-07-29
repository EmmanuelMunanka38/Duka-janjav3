import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserId } from '@/lib/auth';

type SaleWithItems = Prisma.SaleGetPayload<{
  include: { items: { include: { product: true } } };
}>;

type ExpenseData = Prisma.ExpenseGetPayload<{}>;
type ProductData = Prisma.ProductGetPayload<{ include: { supplier: true } }>;

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: Prisma.SaleWhereInput['createdAt'] = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : undefined,
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const csv = generateSalesCSV(sales);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sales-report.csv"',
        },
      });
    }

    if (type === 'expenses') {
      const expensesWhere: Prisma.ExpenseWhereInput = {};
      if (startDate || endDate) {
        expensesWhere.date = {};
        if (startDate) expensesWhere.date.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          expensesWhere.date.lte = end;
        }
      }

      const expenses = await prisma.expense.findMany({
        where: Object.keys(expensesWhere).length ? expensesWhere : undefined,
        orderBy: { date: 'desc' },
      });

      const csv = generateExpensesCSV(expenses);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="expenses-report.csv"',
        },
      });
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        include: { supplier: true },
        orderBy: { name: 'asc' },
      });

      const csv = generateInventoryCSV(products);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inventory-report.csv"',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

function generateSalesCSV(sales: SaleWithItems[]): string {
  const headers = ['Sale #', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Change', 'Payment Method', 'Status'];
  const rows = sales.map(sale => [
    sale.saleNumber,
    new Date(sale.createdAt).toLocaleDateString(),
    sale.customerName || 'Walk-in',
    sale.items.length.toString(),
    sale.totalAmount.toFixed(2),
    sale.paidAmount.toFixed(2),
    sale.change.toFixed(2),
    sale.paymentMethod,
    sale.status,
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateExpensesCSV(expenses: ExpenseData[]): string {
  const headers = ['Date', 'Description', 'Category', 'Vendor', 'Amount'];
  const rows = expenses.map(exp => [
    new Date(exp.date).toLocaleDateString(),
    `"${exp.description}"`,
    exp.category,
    exp.vendor || '',
    exp.amount.toFixed(2),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateInventoryCSV(products: ProductData[]): string {
  const headers = ['SKU', 'Name', 'Category', 'Stock', 'Price', 'Cost', 'Supplier'];
  const rows = products.map(prod => [
    prod.sku,
    `"${prod.name}"`,
    prod.categoryId || '',
    prod.stock.toString(),
    prod.price.toFixed(2),
    prod.cost.toFixed(2),
    prod.supplier?.name || '',
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
