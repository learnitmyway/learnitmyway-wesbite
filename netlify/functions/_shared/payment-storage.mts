import { getStore } from '@netlify/blobs';

export interface PaymentRecord {
  email: string;
  articleSlug: string;
  paidAtUTC: string;
  paymentId: string;
}

function getPaymentsStore() {
  return getStore('payments');
}

function getPaymentRecordKey(email: string, articleSlug: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  return `payment:${normalizedEmail}:${articleSlug}`;
}

export async function storePaymentRecord(
  email: string,
  articleSlug: string,
  paymentId: string
): Promise<void> {
  const store = getPaymentsStore();
  const key = getPaymentRecordKey(email, articleSlug);
  const paymentRecord: PaymentRecord = {
    email: email.toLowerCase().trim(),
    articleSlug,
    paidAtUTC: new Date().toISOString(),
    paymentId,
  };

  try {
    await store.set(key, JSON.stringify(paymentRecord));
    console.log(`✅ Payment record stored: ${key}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to store payment record: ${message}`);
    throw new Error(`Failed to store payment record: ${message}`);
  }
}