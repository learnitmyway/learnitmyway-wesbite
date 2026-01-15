import type { Context } from "@netlify/functions";
import Stripe from 'stripe';

const stripe = new Stripe(getPaymentProviderApiKey());
// TODO: pass as argument
const TARGET_PRICE_ID = 'price_1SEqfgAhWhMKvItA3GfwRisL';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const email = getEmailFromRequest(req);
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const verified = await verifyPaymentForEmail(email);

    return new Response(
      JSON.stringify({ verified, email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    if (error instanceof Error && error.message.includes('PAYMENT_PROVIDER_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function getPaymentProviderApiKey() {
  const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('PAYMENT_PROVIDER_API_KEY is not set in environment variables');
  }
  return apiKey;
}

function getEmailFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  return url.searchParams.get('email');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function verifyPaymentForEmail(email: string): Promise<boolean> {
  try {
    // Primary approach: Find customers by email and check their sessions
    // With customer_creation: 'always' in checkout session creation, Stripe will create a Customer
    // object when email is entered during checkout, making verification reliable
    const customers = await stripe.customers.list({ email });
    
    for (const customer of customers.data) {
      try {
        const sessions = await stripe.checkout.sessions.list({
          customer: customer.id,
          expand: ['data.line_items'],
        });

        for (const session of sessions.data) {
          if (session.payment_status === 'paid' && session.status === 'complete') {
            let lineItems;
            if (session.line_items && 'data' in session.line_items) {
              lineItems = session.line_items.data;
            } else {
              const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id);
              lineItems = lineItemsResponse.data;
            }

            for (const item of lineItems) {
              if (item.price?.id === TARGET_PRICE_ID) {
                return true;
              }
            }
          }
        }
      } catch (sessionError) {
        console.error(`Error checking sessions for customer ${customer.id}:`, sessionError);
        continue;
      }
    }

    // Fallback: Check recent sessions by customer_details.email
    // This handles edge cases (e.g., sessions created before customer_creation: 'always' was set)
    // Note: Limited to 100 most recent sessions, but serves as a safety net
    const recentSessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ['data.line_items'],
    });

    for (const session of recentSessions.data) {
      if (
        session.customer_details?.email === email &&
        session.payment_status === 'paid' &&
        session.status === 'complete'
      ) {
        let lineItems;
        if (session.line_items && 'data' in session.line_items) {
          lineItems = session.line_items.data;
        } else {
          const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id);
          lineItems = lineItemsResponse.data;
        }

        for (const item of lineItems) {
          if (item.price?.id === TARGET_PRICE_ID) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    // Re-throw Stripe API errors to be handled by the main error handler
    console.error('Stripe API error:', error);
    throw error;
  }
}

