import type { Context } from "@netlify/functions";
import Stripe from 'stripe';

const stripe = new Stripe(getPaymentProviderApiKey());
const BASE_URL = process.env.HUGO_BASE_URL || 'http://localhost:8888';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const session = await createCheckoutSession();

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

function getPaymentProviderApiKey() {
  const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('PAYMENT_PROVIDER_API_KEY is not set in environment variables');
  }
  return apiKey;
}

async function createCheckoutSession() {
  return stripe.checkout.sessions.create({
    line_items: [
      {
        price: 'price_1SEqfgAhWhMKvItA3GfwRisL',
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${BASE_URL}/success.html`,
    cancel_url: `${BASE_URL}/cancel.html`,
  });
}

