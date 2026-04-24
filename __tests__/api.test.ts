import { NextRequest, NextResponse } from 'next/server';
import { cleanupTestData, createTestUser, createTestProduct, createTestSupplier, createTestSale, createTestExpense, createTestCustomer } from './test-utils';
import prisma from '@/lib/prisma';

describe('API Tests', () => {
  jest.setTimeout(60000);

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Auth API', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Register User',
            email: `register-${Date.now()}@test.com`,
            password: 'password123',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(data.user.name).toBe('Test Register User');
        expect(data.user.role).toBe('admin');
      });

      it('should reject duplicate email registration', async () => {
        const email = `duplicate-${Date.now()}@test.com`;
        
        await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'First User',
            email,
            password: 'password123',
          }),
        });

        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Second User',
            email,
            password: 'password123',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe('Email already registered');
      });

      it('should reject invalid email format', async () => {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123',
          }),
        });

        expect(response.status).toBe(400);
      });

      it('should reject short password', async () => {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: `${Date.now()}@test.com`,
            password: '123',
          }),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/auth/login', () => {
      let testUser: any;

      beforeEach(async () => {
        testUser = await createTestUser({
          email: `login-test-${Date.now()}@example.com`,
          password: 'validpassword123',
        });
      });

      it('should login with valid credentials', async () => {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: 'validpassword123',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(data.token).toBeDefined();
        expect(data.user.email).toBe(testUser.email);
      });

      it('should reject invalid password', async () => {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: 'wrongpassword',
          }),
        });

        expect(response.status).toBe(401);
      });

      it('should reject non-existent user', async () => {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'password123',
          }),
        });

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Customers API', () => {
    let authToken: string;

    beforeAll(async () => {
      const registerRes = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Customer Test User',
          email: `customer-test-${Date.now()}@example.com`,
          password: 'password123',
        }),
      });
      const registerData = await registerRes.json();
      authToken = registerData.token;

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.user.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/customers', () => {
      it('should return empty array initially', async () => {
        const response = await fetch('http://localhost:3000/api/customers', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should return list of customers after creation', async () => {
        await createTestCustomer({ name: 'Customer One' });
        await createTestCustomer({ name: 'Customer Two' });

        const response = await fetch('http://localhost:3000/api/customers', {
          headers: { Cookie: `session=${authToken}` },
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('POST /api/customers', () => {
      it('should create a new customer', async () => {
        const response = await fetch('http://localhost:3000/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            name: 'New Customer',
            email: `new-${Date.now()}@example.com`,
            phone: '+254700123456',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe('New Customer');
      });

      it('should require customer name', async () => {
        const response = await fetch('http://localhost:3000/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            email: 'test@example.com',
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Products API', () => {
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `product-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/products', () => {
      it('should return list of products', async () => {
        await createTestProduct(testUser.id, { name: 'Test Product 1' });
        await createTestProduct(testUser.id, { name: 'Test Product 2' });

        const response = await fetch('http://localhost:3000/api/products', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should filter products by category', async () => {
        await createTestProduct(testUser.id, { category: 'Electronics' });
        await createTestProduct(testUser.id, { category: 'Food' });

        const response = await fetch('http://localhost:3000/api/products?category=Electronics', {
          headers: { Cookie: `session=${authToken}` },
        });

        const data = await response.json();
        expect(response.status).toBe(200);
      });

      it('should search products by name or SKU', async () => {
        const response = await fetch('http://localhost:3000/api/products?search=Test', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/products', () => {
      it('should create a new product', async () => {
        const response = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            name: 'New Product',
            sku: `NEW-${Date.now()}`,
            price: 29.99,
            cost: 15.00,
            stock: 100,
            category: 'General',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe('New Product');
        expect(data.sku).toBeDefined();
      });

      it('should reject duplicate SKU', async () => {
        const sku = `DUP-${Date.now()}`;
        await createTestProduct(testUser.id, { sku });

        const response = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            name: 'Duplicate SKU Product',
            sku,
            price: 19.99,
            cost: 10.00,
            stock: 50,
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('SKU already exists');
      });

      it('should reject negative price', async () => {
        const response = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            name: 'Invalid Price Product',
            sku: `INV-${Date.now()}`,
            price: -10,
            cost: 5,
            stock: 10,
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Suppliers API', () => {
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `supplier-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/suppliers', () => {
      it('should return list of suppliers', async () => {
        await createTestSupplier(testUser.id, { name: 'Supplier A' });
        await createTestSupplier(testUser.id, { name: 'Supplier B' });

        const response = await fetch('http://localhost:3000/api/suppliers', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe('POST /api/suppliers', () => {
      it('should create a new supplier', async () => {
        const response = await fetch('http://localhost:3000/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            name: 'New Supplier',
            email: `supplier-${Date.now()}@example.com`,
            phone: '+254700111222',
            contactPerson: 'John Doe',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe('New Supplier');
      });

      it('should require supplier name', async () => {
        const response = await fetch('http://localhost:3000/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            email: 'supplier@example.com',
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Sales API', () => {
    let authToken: string;
    let testUser: any;
    let testProduct: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `sale-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;

      testProduct = await createTestProduct(testUser.id, {
        name: 'Sale Test Product',
        stock: 100,
        price: 25.00,
      });
    });

    describe('GET /api/sales', () => {
      it('should return list of sales', async () => {
        await createTestSale(testUser.id, testProduct.id);

        const response = await fetch('http://localhost:3000/api/sales', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should filter sales by date range', async () => {
        const today = new Date();
        const startDate = new Date(today.setDate(today.getDate() - 7)).toISOString();

        const response = await fetch(`http://localhost:3000/api/sales?startDate=${startDate}`, {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/sales', () => {
      it('should create a new sale', async () => {
        const response = await fetch('http://localhost:3000/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            items: [{
              productId: testProduct.id,
              quantity: 2,
              unitPrice: 25.00,
              totalPrice: 50.00,
            }],
            paymentMethod: 'cash',
            paidAmount: 50.00,
            customerName: 'Walk-in Customer',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.saleNumber).toBeDefined();
        expect(data.totalAmount).toBe(50.00);
      });

      it('should reject sale with insufficient payment', async () => {
        const response = await fetch('http://localhost:3000/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            items: [{
              productId: testProduct.id,
              quantity: 5,
              unitPrice: 25.00,
              totalPrice: 125.00,
            }],
            paymentMethod: 'cash',
            paidAmount: 100.00,
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Insufficient payment');
      });

      it('should reject sale with empty items', async () => {
        const response = await fetch('http://localhost:3000/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            items: [],
            paymentMethod: 'cash',
            paidAmount: 0,
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Expenses API', () => {
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `expense-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/expenses', () => {
      it('should return list of expenses', async () => {
        await createTestExpense(testUser.id, { description: 'Expense 1' });
        await createTestExpense(testUser.id, { description: 'Expense 2' });

        const response = await fetch('http://localhost:3000/api/expenses', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });

      it('should filter expenses by category', async () => {
        await createTestExpense(testUser.id, { category: 'Utilities' });
        await createTestExpense(testUser.id, { category: 'Rent' });

        const response = await fetch('http://localhost:3000/api/expenses?category=Utilities', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/expenses', () => {
      it('should create a new expense', async () => {
        const response = await fetch('http://localhost:3000/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            description: 'New Office Supplies',
            amount: 150.00,
            category: 'Supplies',
            date: new Date().toISOString(),
            vendor: 'Office Depot',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.description).toBe('New Office Supplies');
        expect(data.amount).toBe(150.00);
      });

      it('should reject negative amount', async () => {
        const response = await fetch('http://localhost:3000/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            description: 'Invalid Expense',
            amount: -50.00,
            category: 'Test',
            date: new Date().toISOString(),
          }),
        });

        expect(response.status).toBe(400);
      });

      it('should require description', async () => {
        const response = await fetch('http://localhost:3000/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            amount: 50.00,
            category: 'Test',
            date: new Date().toISOString(),
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Contact API', () => {
    describe('POST /api/contact', () => {
      it('should submit contact message', async () => {
        const response = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Contact User',
            email: `contact-${Date.now()}@example.com`,
            subject: 'Test Subject',
            message: 'This is a test message with enough content.',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe('Contact User');
        expect(data.status).toBe('unread');
      });

      it('should reject short message', async () => {
        const response = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Subject',
            message: 'Short',
          }),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/contact', () => {
      it('should return contact messages (requires auth)', async () => {
        const testUser = await createTestUser({
          email: `contact-get-test-${Date.now()}@example.com`,
          password: 'password123',
        });

        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: 'password123',
          }),
        });
        const loginData = await loginRes.json();

        const response = await fetch('http://localhost:3000/api/contact', {
          headers: { Cookie: `session=${loginData.token}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });
    });
  });

  describe('Settings API', () => {
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `settings-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/settings', () => {
      it('should return business settings', async () => {
        const response = await fetch('http://localhost:3000/api/settings', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.businessName).toBeDefined();
      });
    });

    describe('PUT /api/settings', () => {
      it('should update business settings', async () => {
        const response = await fetch('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            businessName: 'My Updated Business',
            businessEmail: `business-${Date.now()}@example.com`,
            businessPhone: '+254700111222',
            theme: 'dark',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.businessName).toBe('My Updated Business');
        expect(data.theme).toBe('dark');
      });

      it('should reject invalid theme', async () => {
        const response = await fetch('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            theme: 'invalid-theme',
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Reports API', () => {
    let authToken: string;

    beforeAll(async () => {
      const testUser = await createTestUser({
        email: `reports-test-${Date.now()}@example.com`,
        password: 'password123',
      });

      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      authToken = loginData.token;
    });

    describe('GET /api/reports', () => {
      it('should generate sales report CSV', async () => {
        const response = await fetch('http://localhost:3000/api/reports?type=sales', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
      });

      it('should generate expenses report CSV', async () => {
        const response = await fetch('http://localhost:3000/api/reports?type=expenses', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
      });

      it('should generate inventory report CSV', async () => {
        const response = await fetch('http://localhost:3000/api/reports?type=inventory', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
      });

      it('should reject invalid report type', async () => {
        const response = await fetch('http://localhost:3000/api/reports?type=invalid', {
          headers: { Cookie: `session=${authToken}` },
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Chatbot API', () => {
    describe('GET /api/chatbot', () => {
      it('should return chat history', async () => {
        const response = await fetch('http://localhost:3000/api/chatbot');

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      });
    });

    describe('POST /api/chatbot', () => {
      it('should respond to greeting', async () => {
        const response = await fetch('http://localhost:3000/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Hello!',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        const lastMessage = data[data.length - 1];
        expect(lastMessage.role).toBe('assistant');
      });

      it('should respond to sales query', async () => {
        const response = await fetch('http://localhost:3000/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'How are my sales today?',
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        const lastMessage = data[data.length - 1];
        expect(lastMessage.content).toContain('Sales');
      });

      it('should reject empty message', async () => {
        const response = await fetch('http://localhost:3000/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '',
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });
});