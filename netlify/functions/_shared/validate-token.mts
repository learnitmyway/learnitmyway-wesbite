import type { TokenRecord } from './token-storage.mts';
import { getToken, renewToken } from './token-storage.mts';
import { getPaymentRecord } from './payment-storage.mts';

export type ValidateTokenSuccess = { success: true; tokenRecord: TokenRecord };
export type ValidateTokenFailure =
  | { success: false; status: 500 }
  | { success: false; status: 401; reason: 'not_found' }
  | { success: false; status: 401; reason: 'expired' };
export type ValidateTokenResult = ValidateTokenSuccess | ValidateTokenFailure;

export async function validateToken(
  articleSlug: string,
  token: string
): Promise<ValidateTokenResult> {
  let tokenRecord: TokenRecord | null;
  try {
    tokenRecord = await getToken(articleSlug, token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to retrieve token:', message);
    return { success: false, status: 500 };
  }

  if (!tokenRecord) {
    console.log('❌ Token not found');
    return { success: false, status: 401, reason: 'not_found' };
  }

  const now = new Date();
  const expiresAt = new Date(tokenRecord.expiresAtUtc);
  const isExpired = now >= expiresAt;

  if (isExpired) {
    const paymentRecord = await getPaymentRecord(tokenRecord.email, articleSlug);
    if (paymentRecord) {
      try {
        await renewToken(articleSlug, token, tokenRecord.email);
        const updatedRecord = await getToken(articleSlug, token);
        if (updatedRecord) {
          console.log('✅ Token renewed (expired but payment record exists)');
          return { success: true, tokenRecord: updatedRecord };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to renew token:', message);
        return { success: false, status: 500 };
      }
    }
    console.log('❌ Token is expired');
    return { success: false, status: 401, reason: 'expired' };
  }

  console.log('✅ Token is valid');
  return { success: true, tokenRecord };
}
