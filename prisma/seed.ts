import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: 'file:/Users/apple/Desktop/duka-janja3/prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@dukajanja.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@dukajanja.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Created user:', user.email);

  // Create business settings
  await prisma.businessSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: 'Duka Janja POS',
      businessEmail: 'contact@dukajanja.com',
      businessPhone: '+254 712 345 678',
      businessAddress: 'Nairobi, Kenya',
    },
  });
  console.log('Created business settings');

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-1' },
      update: {},
      create: {
        id: 'supplier-1',
        name: 'Tech Supplies Ltd',
        contactPerson: 'John Mwangi',
        email: 'john@techsupplies.co.ke',
        phone: '+254 722 111 222',
        address: 'Westlands, Nairobi',
        createdBy: user.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-2' },
      update: {},
      create: {
        id: 'supplier-2',
        name: 'Global Electronics',
        contactPerson: 'Sarah Kimani',
        email: 'sarah@globalelec.com',
        phone: '+254 733 333 444',
        address: 'Kenyatta Avenue, Nairobi',
        createdBy: user.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-3' },
      update: {},
      create: {
        id: 'supplier-3',
        name: 'Office Essentials',
        contactPerson: 'David Ochieng',
        email: 'david@officeessentials.co.ke',
        phone: '+254 711 555 666',
        address: 'Industrial Area, Nairobi',
        createdBy: user.id,
      },
    }),
  ]);
  console.log('Created', suppliers.length, 'suppliers');

  // Create products
  const products = [
    { name: 'Wireless Mouse', sku: 'ELEC-WM-001', price: 45.99, cost: 25.00, stock: 150, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'USB-C Hub', sku: 'ELEC-UC-002', price: 89.99, cost: 50.00, stock: 75, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'Mechanical Keyboard', sku: 'ELEC-MK-003', price: 129.99, cost: 75.00, stock: 45, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'Monitor Stand', sku: 'ELEC-MS-004', price: 59.99, cost: 30.00, stock: 8, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'Webcam HD', sku: 'ELEC-WC-005', price: 79.99, cost: 40.00, stock: 60, category: 'Electronics', supplierId: 'supplier-1' },
    { name: 'Desk Lamp LED', sku: 'HOME-DL-001', price: 34.99, cost: 18.00, stock: 120, category: 'Home Office', supplierId: 'supplier-1' },
    { name: 'Notebook Set', sku: 'OFF-NB-001', price: 12.99, cost: 5.00, stock: 200, category: 'Office Supplies', supplierId: 'supplier-3' },
    { name: 'Pen Pack (50)', sku: 'OFF-PP-002', price: 8.99, cost: 3.00, stock: 3, category: 'Office Supplies', supplierId: 'supplier-3' },
    { name: 'Stapler Heavy Duty', sku: 'OFF-SH-003', price: 24.99, cost: 12.00, stock: 45, category: 'Office Supplies', supplierId: 'supplier-3' },
    { name: 'File Cabinet', sku: 'OFF-FC-004', price: 189.99, cost: 95.00, stock: 15, category: 'Furniture', supplierId: 'supplier-3' },
    { name: 'Desk Organizer', sku: 'HOME-DO-002', price: 22.99, cost: 10.00, stock: 80, category: 'Home Office', supplierId: 'supplier-1' },
    { name: 'Headphones Wireless', sku: 'ELEC-HW-006', price: 149.99, cost: 80.00, stock: 4, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'Phone Charger', sku: 'ELEC-PC-007', price: 19.99, cost: 8.00, stock: 180, category: 'Electronics', supplierId: 'supplier-1' },
    { name: 'Laptop Stand', sku: 'ELEC-LS-008', price: 49.99, cost: 25.00, stock: 55, category: 'Electronics', supplierId: 'supplier-2' },
    { name: 'Whiteboard Markers', sku: 'OFF-WM-005', price: 15.99, cost: 6.00, stock: 90, category: 'Office Supplies', supplierId: 'supplier-3' },
  ];

  for (const product of products) {
    const { category, ...productData } = product;
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...productData,
        lowStockThreshold: 10,
        description: `${product.name} - High quality product`,
        createdBy: user.id,
      },
    });
  }
  console.log('Created', products.length, 'products');

  // Create expenses
  const expenses = [
    { description: 'Office Rent - January', amount: 25000, category: 'Rent', vendor: 'Nairobi Properties Ltd', date: new Date('2026-01-01') },
    { description: 'Electricity Bill', amount: 8500, category: 'Utilities', vendor: 'KPLC', date: new Date('2026-01-05') },
    { description: 'Internet Service', amount: 4999, category: 'Utilities', vendor: 'Safaricom Business', date: new Date('2026-01-10') },
    { description: 'Water Bill', amount: 2500, category: 'Utilities', vendor: 'Nairobi Water', date: new Date('2026-01-15') },
    { description: 'Printer Ink Cartridges', amount: 12000, category: 'Supplies', vendor: 'Office Essentials', date: new Date('2026-02-01') },
    { description: 'Cleaning Services', amount: 8000, category: 'Services', vendor: 'CleanPro Ltd', date: new Date('2026-02-05') },
    { description: 'Security Services', amount: 15000, category: 'Services', vendor: 'SecureTech', date: new Date('2026-02-10') },
    { description: 'Marketing Flyers', amount: 5500, category: 'Marketing', vendor: 'PrintMaster', date: new Date('2026-02-15') },
    { description: 'Staff Salaries', amount: 150000, category: 'Salaries', vendor: 'Internal', date: new Date('2026-03-01') },
    { description: 'Equipment Repair', amount: 7500, category: 'Repairs', vendor: 'TechFix', date: new Date('2026-03-05') },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        ...expense,
        createdBy: user.id,
      },
    });
  }
  console.log('Created', expenses.length, 'expenses');

  // Create some sales
  const allProducts = await prisma.product.findMany();
  const saleData = [
    { items: [{ productIndex: 0, qty: 2 }, { productIndex: 4, qty: 1 }], customer: 'Jane Doe' },
    { items: [{ productIndex: 1, qty: 1 }, { productIndex: 2, qty: 1 }], customer: 'John Smith' },
    { items: [{ productIndex: 5, qty: 3 }, { productIndex: 10, qty: 2 }], customer: 'Mary Johnson' },
    { items: [{ productIndex: 6, qty: 5 }, { productIndex: 7, qty: 3 }], customer: 'Walk-in Customer' },
    { items: [{ productIndex: 12, qty: 2 }, { productIndex: 13, qty: 1 }], customer: 'Tech Solutions Ltd' },
    { items: [{ productIndex: 3, qty: 1 }, { productIndex: 11, qty: 1 }], customer: 'Robert Brown' },
    { items: [{ productIndex: 8, qty: 4 }], customer: 'Alice White' },
    { items: [{ productIndex: 14, qty: 10 }, { productIndex: 6, qty: 5 }], customer: 'Business Solutions' },
  ];

  for (let i = 0; i < saleData.length; i++) {
    const sale = saleData[i];
    const saleNumber = `SALE-${Date.now()}-${i.toString().padStart(4, '0')}`;
    const items = sale.items.map(item => ({
      productId: allProducts[item.productIndex].id,
      quantity: item.qty,
      unitPrice: allProducts[item.productIndex].price,
      totalPrice: allProducts[item.productIndex].price * item.qty,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    await prisma.sale.create({
      data: {
        saleNumber,
        totalAmount,
        paidAmount: totalAmount,
        change: 0,
        paymentMethod: i % 2 === 0 ? 'cash' : 'mpesa',
        customerName: sale.customer,
        status: 'completed',
        createdBy: user.id,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        items: {
          create: items,
        },
      },
    });

    // Reduce stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
  console.log('Created', saleData.length, 'sales');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@dukajanja.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
