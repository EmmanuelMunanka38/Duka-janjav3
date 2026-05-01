import { prisma } from '@/lib/prisma';

export type NotificationType = 'low_stock' | 'large_sale' | 'return_processed' | 'daily_summary' | 'payment_overdue';

export async function createNotification(data: {
  type: NotificationType;
  messageEn: string;
  messageSw: string;
  branchId?: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  relatedRecordNumber?: string;
  userId: string;
}) {
  try {
    await prisma.notification.create({
      data,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function checkLowStockNotification(
  productId: string,
  productName: string,
  newStock: number,
  threshold: number,
  userId: string,
  branchId?: string
) {
  if (newStock <= threshold) {
    await createNotification({
      type: 'low_stock',
      messageEn: `Stock low for ${productName}. Current: ${newStock}, Threshold: ${threshold}`,
      messageSw: `Bidhaa ${productName} imefika kiwango cha chini. Sasa: ${newStock}, Kiwango: ${threshold}`,
      branchId,
      relatedRecordId: productId,
      relatedRecordType: 'product',
      relatedRecordNumber: productName,
      userId,
    });
  }
}

export async function checkLargeSaleNotification(
  saleId: string,
  saleNumber: string,
  amount: number,
  threshold: number,
  userId: string,
  branchId?: string
) {
  if (amount >= threshold) {
    await createNotification({
      type: 'large_sale',
      messageEn: `Large sale recorded: ${saleNumber} - ${amount}`,
      messageSw: `Mauzo makubwa yamerekodi: ${saleNumber} - ${amount}`,
      branchId,
      relatedRecordId: saleId,
      relatedRecordType: 'sale',
      relatedRecordNumber: saleNumber,
      userId,
    });
  }
}