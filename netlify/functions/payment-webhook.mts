/**
 * Payment Webhook Handler
 * Handles payment completion events from payment providers
 */
import type { Context } from "@netlify/functions";
import { createPaymentProvider } from "../../lib/payment-providers/stripe.ts";
import { createEmailProvider } from "../../lib/email-providers/sendgrid.ts";
import { generateToken, storeToken, storePaymentRecord } from "../../lib/kv-utils.ts";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const kv = context.kv;
    if (!kv) {
      throw new Error('KV store not available. Please bind a KV namespace to this function.');
    }

    // Get provider configuration
    const paymentProviderName = process.env.PAYMENT_PROVIDER || 'stripe';
    const paymentApiKey = process.env.PAYMENT_PROVIDER_API_KEY;
    const paymentWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const emailProviderName = process.env.EMAIL_PROVIDER || 'sendgrid';
    const emailApiKey = process.env.EMAIL_PROVIDER_API_KEY;
    const baseUrl = getRequestBaseUrl(req);

    if (!paymentApiKey || !paymentWebhookSecret || !emailApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Create provider instances
    const paymentProvider = createPaymentProvider(paymentProviderName, paymentApiKey);
    const emailProvider = createEmailProvider(emailProviderName, emailApiKey);

    // Get webhook signature (Stripe uses 'stripe-signature' header)
    const signature = req.headers.get('stripe-signature') || req.headers.get('x-signature') || '';
    
    // Read request body as text for signature verification
    const body = await req.text();

    // Verify webhook signature
    if (!paymentProvider.verifyWebhookSignature(body, signature, paymentWebhookSecret)) {
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse webhook event (after verification)
    const event = JSON.parse(body) as { type: string; data: { object: unknown } };

    // Extract payment data
    const paymentData = paymentProvider.extractPaymentData({
      type: event.type,
      data: event.data,
    });

    if (!paymentData) {
      // Not a payment completion event, return success
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!paymentData.email || !paymentData.articleSlug) {
      console.error('Missing email or articleSlug in payment data:', paymentData);
      return new Response('Invalid payment data', { status: 400 });
    }

    // Generate access token
    const token = generateToken();

    // Store token and payment record
    await storeToken(kv, token, paymentData.email, paymentData.articleSlug);
    await storePaymentRecord(kv, paymentData.email, paymentData.articleSlug, paymentData.paymentId);

    // Generate magic link
    const magicLink = `${baseUrl}/verify-access?token=${token}`;

    // Get article title (you may want to fetch this from your CMS or pass it in metadata)
    const articleTitle = paymentData.articleSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Send magic link email
    await emailProvider.sendEmail({
      to: paymentData.email,
      subject: `Your access link for ${articleTitle}`,
      html: generateEmailTemplate(articleTitle, magicLink),
      text: generateEmailText(articleTitle, magicLink),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

function getRequestBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function generateEmailTemplate(articleTitle: string, magicLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #004ba0;">Thank you for your purchase!</h1>
          <p>You now have access to <strong>${articleTitle}</strong>.</p>
          <p>Click the link below to access your premium content:</p>
          <p style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #004ba0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Access Article
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 30 days, but you can request a new one anytime if you've already paid.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${magicLink}" style="color: #004ba0; word-break: break-all;">${magicLink}</a>
          </p>
        </div>
      </body>
    </html>
  `;
}

function generateEmailText(articleTitle: string, magicLink: string): string {
  return `
Thank you for your purchase!

You now have access to ${articleTitle}.

Click the link below to access your premium content:
${magicLink}

This link will expire in 30 days, but you can request a new one anytime if you've already paid.
  `.trim();
}

