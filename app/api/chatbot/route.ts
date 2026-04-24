import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
    const body = await request.json();
    const { content } = z.object({ content: z.string().min(1) }).parse(body);

    await prisma.chatMessage.create({
      data: {
        role: 'user',
        content,
      },
    });

    const response = await generateIntelligentResponse(content);

    await prisma.chatMessage.create({
      data: {
        role: 'assistant',
        content: response,
      },
    });

    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

async function generateIntelligentResponse(input: string): Promise<string> {
  const lower = input.toLowerCase();
  
  // Greetings
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(lower)) {
    return `Hello! 👋 I'm your POS assistant with access to your business data.

I can help you with:
• Sales insights and trends
• Inventory status and alerts
• Expense tracking
• Business performance metrics
• System guidance

What would you like to know?`;
  }

  // Thanks
  if (/\b(thank|thanks)\b/.test(lower)) {
    return "You're welcome! Feel free to ask if you need anything else about your POS system.";
  }

  // Sales questions
  if (/\b(sale|revenue|income|earning|transaction|profit)\b/.test(lower)) {
    return await getSalesInsights();
  }

  // Inventory questions
  if (/\b(inventory|stock|product|item|low stock|out of stock)\b/.test(lower)) {
    return await getInventoryInsights();
  }

  // Expense questions
  if (/\b(expense|cost|spending|bill|payment|vendor)\b/.test(lower)) {
    return await getExpenseInsights();
  }

  // Dashboard metrics
  if (/\b(dashboard|overview|summary|metric|kpi|today|week|month)\b/.test(lower)) {
    return await getDashboardSummary();
  }

  // Best performing
  if (/\b(best|top|popular|selling|trending)\b/.test(lower)) {
    return await getTopProducts();
  }

  // Help / How to
  if (/\b(help|how|guide|tutorial|feature)\b/.test(lower)) {
    return getSystemHelp();
  }

  // Reports
  if (/\b(report|export|csv|download)\b/.test(lower)) {
    return `To generate reports:

1. Go to the Reports page
2. Select report type (Sales, Expenses, or Inventory)
3. Choose date range (Week, Month, Year, or All)
4. Click "Export CSV" to download

Reports include detailed breakdowns of:
• Sales by date with totals
• Expense categories and vendors
• Current inventory levels`;
  }

  // General fallback
  return `I can help you understand your business data. Try asking about:

• "What are my total sales this month?"
• "Which products are running low on stock?"
• "Show me my top selling products"
• "What are my total expenses?"
• "Give me a business summary"

Or ask for help with any specific feature!`;
}

async function getSalesInsights(): Promise<string> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [monthlySales, weeklySales, allSales, lastMonthSales] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: { include: { product: true } } },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lt: startOfMonth,
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const monthTotal = monthlySales._sum.totalAmount || 0;
    const lastMonthTotal = lastMonthSales._sum.totalAmount || 0;
    const growthNum = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal * 100) : null;
    const growth = growthNum !== null ? growthNum.toFixed(1) : 'N/A';

    const recentSalesList = allSales.map((s: typeof allSales[0]) => 
      `• ${s.customerName || 'Walk-in'}: $${s.totalAmount.toFixed(2)} (${s.items.length} items)`
    ).join('\n');

    return `📊 Sales Insights:

**This Month:**
• Total Revenue: $${monthTotal.toFixed(2)}
• Transactions: ${monthlySales._count}
• Avg. Sale: $${monthlySales._count > 0 ? (monthTotal / monthlySales._count).toFixed(2) : '0.00'}
${growthNum !== null ? `• vs Last Month: ${growthNum > 0 ? '📈 +' + growth + '%' : '📉 ' + growth + '%'}` : ''}

**Last 7 Days:**
• Revenue: $${(weeklySales._sum.totalAmount || 0).toFixed(2)}
• Transactions: ${weeklySales._count}

**Recent Sales:**
${recentSalesList || 'No recent sales'}`;
  } catch (error) {
    console.error('Sales insights error:', error);
    return "I couldn't fetch sales data. Please try again.";
  }
}

async function getInventoryInsights(): Promise<string> {
  try {
    const [products, lowStock, outOfStock, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        where: { stock: { lte: 10, gte: 1 } },
        orderBy: { stock: 'asc' },
        take: 5,
      }),
      prisma.product.findMany({
        where: { stock: 0 },
        take: 5,
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const lowStockList = lowStock.map((p: typeof lowStock[0]) => 
      `• ${p.name}: ${p.stock} left (threshold: ${p.lowStockThreshold})`
    ).join('\n');

    const outOfStockList = outOfStock.map((p: typeof outOfStock[0]) => 
      `• ${p.name} (${p.sku})`
    ).join('\n');

    const totalValue = await prisma.product.aggregate({
      _sum: { stock: true, price: true },
    });

    const totalStock = totalValue._sum.stock || 0;
    const avgPrice = totalValue._sum.price || 0;
    const inventoryValue = totalStock > 0 ? (totalStock * avgPrice) / totalStock : 0;

    return `📦 Inventory Status:

**Overview:**
• Total Products: ${products}
• Categories: ${categories.length}
• Inventory Value: $${(totalStock * avgPrice).toFixed(2)}

${outOfStock.length > 0 ? `⚠️ **Out of Stock (${outOfStock.length}):**
${outOfStockList}

` : ''}${lowStock.length > 0 ? `🔴 **Low Stock Alerts (${lowStock.length} items):**
${lowStockList}

` : ''}${outOfStock.length === 0 && lowStock.length === 0 ? '✅ All products are well stocked!\n' : ''}Would you like me to help you reorder or manage inventory?`;
  } catch (error) {
    console.error('Inventory insights error:', error);
    return "I couldn't fetch inventory data. Please try again.";
  }
}

async function getExpenseInsights(): Promise<string> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyExpenses, byCategory, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const categoryList = byCategory
      .sort((a: typeof byCategory[0], b: typeof byCategory[0]) => (b._sum.amount || 0) - (a._sum.amount || 0))
      .map((c: typeof byCategory[0]) => `• ${c.category}: $${(c._sum.amount || 0).toFixed(2)}`)
      .join('\n');

    const recentList = recentExpenses.map((e: typeof recentExpenses[0]) => 
      `• ${e.description}: $${e.amount.toFixed(2)} (${e.category})`
    ).join('\n');

    return `💸 Expense Insights:

**This Month:**
• Total Expenses: $${(monthlyExpenses._sum.amount || 0).toFixed(2)}
• Transactions: ${monthlyExpenses._count}
• Avg. Expense: $${monthlyExpenses._count > 0 ? (monthlyExpenses._sum.amount! / monthlyExpenses._count).toFixed(2) : '0.00'}

**By Category:**
${categoryList || 'No expenses recorded'}

**Recent Expenses:**
${recentList || 'No recent expenses'}`;
  } catch (error) {
    console.error('Expense insights error:', error);
    return "I couldn't fetch expense data. Please try again.";
  }
}

async function getDashboardSummary(): Promise<string> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaySales, weeklySales, monthlySales, products, lowStock, monthlyExpenses] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.expense.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    const profit = (monthlySales._sum.totalAmount || 0) - (monthlyExpenses._sum.amount || 0);

    return `📈 Business Summary:

**Today:**
• Sales: $${(todaySales._sum.totalAmount || 0).toFixed(2)}
• Transactions: ${todaySales._count}

**This Week:**
• Sales: $${(weeklySales._sum.totalAmount || 0).toFixed(2)}
• Transactions: ${weeklySales._count}

**This Month:**
• Revenue: $${(monthlySales._sum.totalAmount || 0).toFixed(2)}
• Expenses: $${(monthlyExpenses._sum.amount || 0).toFixed(2)}
• Net Profit: $${profit.toFixed(2)}

**Inventory:**
• Products: ${products}
• Low Stock Alerts: ${lowStock}

${lowStock > 0 ? `⚠️ ${lowStock} products need attention!\n` : ''}Ask me for more details on any metric.`;
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return "I couldn't fetch dashboard data. Please try again.";
  }
}

async function getTopProducts(): Promise<string> {
  try {
    const salesWithItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      salesWithItems.map(async (item: typeof salesWithItems[0]) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, price: true },
        });
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
        };
      })
    );

    if (topProducts.length === 0) {
      return `📊 Top Products:

No sales data available yet.

Products will be ranked by quantity sold once you start making sales.`;
    }

    const productList = topProducts.map((p: typeof topProducts[0], i: number) => 
      `${i + 1}. ${p?.name} (${p?.sku})
   Sold: ${p?.totalSold} units | $${((p?.totalSold || 0) * (p?.price || 0)).toFixed(2)} revenue`
    ).join('\n');

    return `🏆 Top Selling Products:

${productList}

This ranking is based on total units sold across all transactions.`;
  } catch (error) {
    console.error('Top products error:', error);
    return "I couldn't fetch product data. Please try again.";
  }
}

function getSystemHelp(): string {
  return `📖 System Guide:

**Navigation:**
• Dashboard - Overview of your business
• POS - Process sales transactions
• Inventory - Manage products & stock
• Expenses - Track business spending
• Reports - Generate CSV exports
• Analytics - Visual charts & insights
• Suppliers - Manage vendor relationships
• AI Chat - Ask me anything!
• Settings - Configure your business

**Quick Tips:**
• All pages auto-save data
• Use the sidebar to navigate
• Click notifications for alerts
• Export reports as CSV for accounting

What would you like to learn more about?`;
}
