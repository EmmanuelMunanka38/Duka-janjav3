export async function logActivity(
  prisma: any,
  action: string,
  recordType: string,
  recordId: string,
  details: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  userId?: string,
  branchId?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        recordType,
        recordId,
        details,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId,
        branchId,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function getRecordHistory(prisma: any, recordType: string, recordId: string) {
  return prisma.activityLog.findMany({
    where: { recordType, recordId },
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveDocument(
  prisma: any,
  type: string,
  reference: string,
  title: string,
  content: string,
  metadata?: Record<string, unknown>,
  userId?: string,
  branchId?: string,
  saleId?: string,
  customerId?: string,
  supplierId?: string
) {
  return prisma.document.create({
    data: {
      type,
      reference,
      title,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userId,
      branchId,
      saleId,
      customerId,
      supplierId,
    },
  });
}

export async function getDocuments(
  prisma: any,
  filters: {
    type?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
) {
  const where: Record<string, unknown> = {};

  if (filters.type) where.type = filters.type;
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search } },
      { title: { contains: filters.search } },
    ];
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = end;
    }
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });
}

export const ACTION_LABELS: Record<string, Record<string, string>> = {
  sw: {
    create: 'Udugizo',
    update: 'Marekebisho',
    delete: 'Ufutaji',
    void: 'Kubatiliwa',
    restore: 'Kurejesha',
    activate: 'Kuwezesha',
    deactivate: 'Kuzimwa',
    login: 'Kuingia',
    logout: 'Kutoka',
    view: 'Kutazama',
    print: 'Kuchapisha',
    download: 'Kushusha',
    export: 'Kutoa',
    import: 'Kuingiza',
    stock_adjust: 'Marekebisho wa Hisa',
    price_change: 'Mabadiliko ya Bei',
    stock_transfer: 'Muhamisho wa Hisa',
    credit_payment: 'Malipo ya Mikropo',
    return_process: 'Kusindika Rudisha',
  },
  en: {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    void: 'Voided',
    restore: 'Restored',
    activate: 'Activated',
    deactivate: 'Deactivated',
    login: 'Logged in',
    logout: 'Logged out',
    view: 'Viewed',
    print: 'Printed',
    download: 'Downloaded',
    export: 'Exported',
    import: 'Imported',
    stock_adjust: 'Stock Adjusted',
    price_change: 'Price Changed',
    stock_transfer: 'Stock Transferred',
    credit_payment: 'Credit Payment',
    return_process: 'Return Processed',
  },
};

export const RECORD_TYPE_LABELS: Record<string, Record<string, string>> = {
  sw: {
    product: 'Bidhaa',
    sale: 'Uuzaji',
    customer: 'Mteja',
    supplier: 'Muuzaji',
    expense: 'Gharama',
    branch: 'Duka',
    user: 'Mtumiaji',
    payment: 'Malipo',
    return: 'Rudisha',
    purchase: 'Ununuzi',
  },
  en: {
    product: 'Product',
    sale: 'Sale',
    customer: 'Customer',
    supplier: 'Supplier',
    expense: 'Expense',
    branch: 'Branch',
    user: 'User',
    payment: 'Payment',
    return: 'Return',
    purchase: 'Purchase',
  },
};

export const DOCUMENT_TYPES: Record<string, Record<string, string>> = {
  sw: {
    receipt: 'Hati ya Malipo',
    invoice: 'Ankara',
    statement: 'Hati ya Akaunti',
    credit_note: 'Hati ya Mkopo',
    debit_note: 'Hati ya Deni',
    purchase_order: 'Agizo la Ununuzi',
    delivery_note: 'Hati ya Kupokelea',
    return_note: 'Hati ya Rudisha',
  },
  en: {
    receipt: 'Receipt',
    invoice: 'Invoice',
    statement: 'Statement',
    credit_note: 'Credit Note',
    debit_note: 'Debit Note',
    purchase_order: 'Purchase Order',
    delivery_note: 'Delivery Note',
    return_note: 'Return Note',
  },
};