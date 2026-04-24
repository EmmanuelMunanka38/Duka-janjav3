import prisma from '@/lib/prisma';

export async function createTestUser(data?: {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(data?.password || 'testpassword123', 10);
  
  return prisma.user.create({
    data: {
      name: data?.name || 'Test User',
      email: data?.email || `test-${Date.now()}@example.com`,
      password: hashedPassword,
      role: data?.role || 'admin',
    },
  });
}

export async function createTestProduct(userId: string, data?: Partial<{
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}>) {
  return prisma.product.create({
    data: {
      name: data?.name || 'Test Product',
      sku: data?.sku || `TEST-SKU-${Date.now()}`,
      price: data?.price || 10.00,
      cost: data?.cost || 5.00,
      stock: data?.stock || 100,
      category: data?.category || 'Test Category',
      createdBy: userId,
    },
  });
}

export async function createTestSupplier(userId: string, data?: Partial<{
  name: string;
  email: string;
  phone: string;
}>) {
  return prisma.supplier.create({
    data: {
      name: data?.name || 'Test Supplier',
      email: data?.email || `supplier-${Date.now()}@example.com`,
      phone: data?.phone || '+1234567890',
      createdBy: userId,
    },
  });
}

export async function createTestSale(userId: string, productId: string, data?: Partial<{
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
}>) {
  const total = data?.totalAmount || 50.00;
  const paid = data?.paidAmount || 50.00;
  
  return prisma.sale.create({
    data: {
      saleNumber: `SALE-TEST-${Date.now()}`,
      totalAmount: total,
      paidAmount: paid,
      change: paid - total,
      paymentMethod: data?.paymentMethod || 'cash',
      status: 'completed',
      createdBy: userId,
      items: {
        create: {
          productId,
          quantity: 5,
          unitPrice: total / 5,
          totalPrice: total,
        },
      },
    },
    include: {
      items: true,
    },
  });
}

export async function createTestExpense(userId: string, data?: Partial<{
  description: string;
  amount: number;
  category: string;
  date: Date;
}>) {
  return prisma.expense.create({
    data: {
      description: data?.description || 'Test Expense',
      amount: data?.amount || 25.00,
      category: data?.category || 'Utilities',
      date: data?.date || new Date(),
      createdBy: userId,
    },
  });
}

export async function createTestCustomer(data?: Partial<{
  name: string;
  email: string;
  phone: string;
}>) {
  return prisma.customer.create({
    data: {
      name: data?.name || 'Test Customer',
      email: data?.email || `customer-${Date.now()}@example.com`,
      phone: data?.phone || '+1234567890',
    },
  });
}

export async function cleanupTestData() {
  const deleteMessages = prisma.chatMessage.deleteMany();
  const deleteSaleItems = prisma.saleItem.deleteMany();
  const deleteSales = prisma.sale.deleteMany();
  const deleteExpenses = prisma.expense.deleteMany();
  const deleteProducts = prisma.product.deleteMany();
  const deleteSuppliers = prisma.supplier.deleteMany();
  const deleteCustomers = prisma.customer.deleteMany();
  const deleteSettings = prisma.businessSettings.deleteMany();
  const deleteMessages2 = prisma.contactMessage.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteMessages,
    deleteSaleItems,
    deleteSales,
    deleteExpenses,
    deleteProducts,
    deleteSuppliers,
    deleteCustomers,
    deleteSettings,
    deleteMessages2,
    deleteUsers,
  ]);
}