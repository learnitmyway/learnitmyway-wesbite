/**
 * Stripe Payment Provider Implementation
 */
import Stripe from 'stripe';
import type { PaymentProvider, PaymentWebhookEvent, PaymentSessionMetadata } from '../payment-provider';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  extractPaymentData(event: PaymentWebhookEvent): PaymentSessionMetadata | null {
    // Handle Stripe checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      // Stripe event data structure: { object: Session }
      const sessionData = event.data as { object?: Stripe.Checkout.Session } | Stripe.Checkout.Session;
      const session = 'object' in sessionData ? sessionData.object : sessionData;
      
      if (!session) {
        return null;
      }
      
      if (session.payment_status === 'paid') {
        const metadata = session.metadata || {};
        return {
          email: session.customer_email || metadata.email || '',
          articleSlug: metadata.articleSlug || '',
          paymentId: session.id,
        };
      }
    }
    
    return null;
  }

  async createCheckoutSession(params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; id: string }> {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata || {},
    });

    return {
      url: session.url || '',
      id: session.id,
    };
  }
}

/**
 * Factory function to create payment provider instance
 */
export function createPaymentProvider(providerName: string, apiKey: string): PaymentProvider {
  if (providerName === 'stripe') {
    return new StripeProvider(apiKey);
  }
  
  throw new Error(`Unsupported payment provider: ${providerName}`);
}

