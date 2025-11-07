/**
 * Payment Provider Interface
 * Abstract interface for payment providers to allow easy swapping
 */

export interface PaymentWebhookEvent {
  type: string;
  data: unknown;
}

export interface PaymentSessionMetadata {
  email: string;
  articleSlug: string;
  paymentId: string;
}

export interface PaymentProvider {
  /**
   * Verify webhook signature from payment provider
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean;

  /**
   * Extract payment completion data from webhook event
   */
  extractPaymentData(event: PaymentWebhookEvent): PaymentSessionMetadata | null;

  /**
   * Create a checkout session
   */
  createCheckoutSession(params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; id: string }>;
}

