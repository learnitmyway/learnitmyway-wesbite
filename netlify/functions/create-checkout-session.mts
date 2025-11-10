import type { Context } from "@netlify/functions";
import Stripe from 'stripe';
import { getPaymentProviderApiKey } from "./_shared/payment.mts";

const stripe = new Stripe(getPaymentProviderApiKey());

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const baseUrl = getRequestBaseUrl(req);
    const session = await createCheckoutSession(baseUrl);

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

async function createCheckoutSession(baseUrl: string) {
  return stripe.checkout.sessions.create({
    line_items: [
      {
      // TODO: pass as argument
        price: 'price_1SEqfgAhWhMKvItA3GfwRisL',
        quantity: 1,
      },
    ],
    mode: 'payment',
    // TODO: pass as argument
    success_url: `${baseUrl}/success.html`,
    cancel_url: `${baseUrl}/cancel.html`,
  });
}

