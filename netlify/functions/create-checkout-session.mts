import type { Context } from "@netlify/functions";
import { createPaymentProvider } from "../../lib/payment-providers/stripe.ts";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    
    // Get request body
    const body = await req.json().catch(() => ({}));
    const { priceId, articleSlug, email } = body;

    if (!priceId || !articleSlug) {
      return new Response(JSON.stringify({ error: 'Missing priceId or articleSlug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get payment provider
    const paymentProviderName = process.env.PAYMENT_PROVIDER || 'stripe';
    const paymentApiKey = process.env.PAYMENT_PROVIDER_API_KEY;
    
    if (!paymentApiKey) {
      throw new Error('PAYMENT_PROVIDER_API_KEY is not set in environment variables');
    }

    const paymentProvider = createPaymentProvider(paymentProviderName, paymentApiKey);

    // Create checkout session with metadata
    const session = await paymentProvider.createCheckoutSession({
      priceId,
      successUrl: `${baseUrl}/success.html?articleSlug=${encodeURIComponent(articleSlug)}`,
      cancelUrl: `${baseUrl}/cancel.html`,
      metadata: {
        articleSlug,
        ...(email && { email }),
      },
    });

    return new Response(null, {
      status: 303,
      headers: {
        'Location': session.url || '',
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function getRequestBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

