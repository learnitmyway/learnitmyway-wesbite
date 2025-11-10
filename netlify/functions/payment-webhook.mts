import type { Context } from '@netlify/functions';
import Stripe from 'stripe';
import { getPaymentProviderApiKey } from './_shared/payment.mts';

const stripe = new Stripe(getPaymentProviderApiKey());

export default async (req: Request, context: Context) => {
  console.log('🔔 Payment webhook received');

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // TODO: extract method
    if (!webhookSecret) {
      console.error('❌ Missing PAYMENT_WEBHOOK_SECRET');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: extract and make generic
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const rawBody = await req.text();
    console.log('📝 Request body length:', rawBody.length);

    // TODO: extract and make generic
    console.log('🔐 Verifying webhook signature...');
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Webhook signature verification failed:', message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Webhook signature verified');
    console.log('📋 Event type:', event.type);

    // Check if this is a payment completion event
    if (event.type !== 'checkout.session.completed') {
      console.log('ℹ️ Not a payment completion event, ignoring');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('💰 Payment completed event detected');

    // Extract payment session details
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    const paymentId = session.id;
    const metadata = session.metadata || {};

    if (!email) {
      console.error('❌ No customer email found in checkout session');
      return new Response(
        JSON.stringify({ error: 'No customer email found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📧 Customer email:', email);
    console.log('🆔 Payment ID:', paymentId);
    console.log('📎 Metadata:', JSON.stringify(metadata));

    // TODO: Generate token
    // TODO: Store token in Netlify KV
    // TODO: Store payment record in Netlify KV
    // TODO: Send magic link email

    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        received: true,
        message: 'Webhook processed (token generation not yet implemented)'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', details: message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};