/**
 * KV Store Utilities
 * Helper functions for managing access tokens and payment records in Netlify KV
 */

export interface TokenData {
  email: string;
  createdAt: number;
  expiresAt: number;
  articleSlug: string;
}

export interface PaymentRecord {
  email: string;
  articleSlug: string;
  paidAt: number;
  paymentId: string;
}

const TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const PAYMENT_RECORD_TTL = 10 * 365 * 24 * 60 * 60; // 10 years in seconds

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  // Use crypto.randomUUID() which is available in Deno runtime
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Type for Netlify KV (Deno.Kv interface)
type KvStore = {
  get<T = unknown>(key: readonly unknown[]): Promise<{ value: T | null; versionstamp: string | null }>;
  set(key: readonly unknown[], value: unknown, options?: { expireIn?: number }): Promise<{ ok: boolean; versionstamp: string }>;
  delete(key: readonly unknown[]): Promise<void>;
};

/**
 * Store access token in KV
 */
export async function storeToken(
  kv: KvStore,
  token: string,
  email: string,
  articleSlug: string
): Promise<void> {
  const now = Date.now();
  const expiresAt = now + (TOKEN_TTL * 1000);
  
  const tokenData: TokenData = {
    email,
    createdAt: now,
    expiresAt,
    articleSlug,
  };

  await kv.set(
    ['token', token],
    tokenData,
    { expireIn: TOKEN_TTL * 1000 } // milliseconds
  );
}

/**
 * Get token data from KV
 */
export async function getToken(
  kv: KvStore,
  token: string
): Promise<TokenData | null> {
  const result = await kv.get<TokenData>(['token', token]);
  return result.value;
}

/**
 * Store payment record in KV
 */
export async function storePaymentRecord(
  kv: KvStore,
  email: string,
  articleSlug: string,
  paymentId: string
): Promise<void> {
  const paymentRecord: PaymentRecord = {
    email,
    articleSlug,
    paidAt: Date.now(),
    paymentId,
  };

  await kv.set(
    ['payment', email, articleSlug],
    paymentRecord,
    { expireIn: PAYMENT_RECORD_TTL * 1000 } // milliseconds
  );
}

/**
 * Get payment record from KV
 */
export async function getPaymentRecord(
  kv: KvStore,
  email: string,
  articleSlug: string
): Promise<PaymentRecord | null> {
  const result = await kv.get<PaymentRecord>(['payment', email, articleSlug]);
  return result.value;
}

/**
 * Check if token is valid (exists and not expired)
 */
export function isTokenValid(tokenData: TokenData | null): boolean {
  if (!tokenData) return false;
  return Date.now() < tokenData.expiresAt;
}

