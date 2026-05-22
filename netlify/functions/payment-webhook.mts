import type { Context } from '@netlify/functions';
import Stripe from 'stripe';
import { getPaymentProviderApiKey } from './_shared/payment.mts';
import { storePaymentRecord } from './_shared/payment-storage.mts';
import { storeToken } from './_shared/token-storage.mts';
import { generateMagicLink } from './_shared/magic-link.mts';
import { getRequestBaseUrl } from './_shared/request-utils.mts';
import { sendMagicLinkEmail } from './_shared/email.mts';

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

    const articleSlug = metadata.articleSlug;
    if (!articleSlug) {
      console.error('❌ No articleSlug found in checkout session metadata');
      return new Response(
        JSON.stringify({ error: 'No articleSlug found in payment metadata' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📄 Article slug:', articleSlug);

    try {
      await storePaymentRecord(email, articleSlug, paymentId);
      console.log('✅ Payment record stored successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to store payment record:', message);
      return new Response(
        JSON.stringify({ 
          error: 'Payment verified but failed to store payment record',
          details: message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const tokenUuid = crypto.randomUUID();
    const tokenExpirationDays = 30;
    const expiresAtUtc = new Date();
    expiresAtUtc.setDate(expiresAtUtc.getDate() + tokenExpirationDays);
    const expiresAtUtcString = expiresAtUtc.toISOString();

    try {
      await storeToken({ articleSlug, uuid: tokenUuid, email, expiresAtUtc: expiresAtUtcString });
      console.log('✅ Token stored successfully');
      console.log('🔑 Token UUID:', tokenUuid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to store token:', message);
      return new Response(
        JSON.stringify({ 
          error: 'Payment verified but failed to store token',
          details: message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const baseUrl = getRequestBaseUrl(req);
    const magicLink = generateMagicLink(baseUrl, articleSlug, tokenUuid);
    console.log('🔗 Magic link:', magicLink);

    try {
      await sendMagicLinkEmail({ to: email, magicLink, articleSlug });
      console.log('✅ Magic link email sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send magic link email (payment and token stored):', message);
      // Option A: still return 200; user has access; future "resend link" can compensate
    }

    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        received: true,
        message: 'Webhook processed successfully'
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