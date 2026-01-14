/**
 * Resend Magic Link Function
 * Resends magic link email for users who have already paid
 */
import type { Context } from "@netlify/functions";
import { getPaymentRecord, generateToken, storeToken } from "../../lib/kv-utils.ts";
import { createEmailProvider } from "../../lib/email-providers/sendgrid.ts";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const kv = context.kv;
    if (!kv) {
      throw new Error('KV store not available');
    }

    const body = await req.json();
    const { email, articleSlug } = body;

    if (!email || !articleSlug) {
      return new Response(JSON.stringify({ error: 'Missing email or articleSlug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if payment record exists
    const paymentRecord = await getPaymentRecord(kv, email, articleSlug);

    if (!paymentRecord) {
      // Don't reveal whether email exists or not (security best practice)
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If a payment record exists for this email, a magic link has been sent.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new token
    const token = generateToken();
    await storeToken(kv, token, email, articleSlug);

    // Get base URL
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const magicLink = `${baseUrl}/verify-access?token=${token}`;

    // Get email provider
    const emailProviderName = process.env.EMAIL_PROVIDER || 'sendgrid';
    const emailApiKey = process.env.EMAIL_PROVIDER_API_KEY;
    
    if (!emailApiKey) {
      throw new Error('EMAIL_PROVIDER_API_KEY not set');
    }

    const emailProvider = createEmailProvider(emailProviderName, emailApiKey);

    // Get article title
    const articleTitle = articleSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Send magic link email
    await emailProvider.sendEmail({
      to: email,
      subject: `Your access link for ${articleTitle}`,
      html: generateEmailTemplate(articleTitle, magicLink),
      text: generateEmailText(articleTitle, magicLink),
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Magic link sent successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error resending magic link:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function generateEmailTemplate(articleTitle: string, magicLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #004ba0;">Your Access Link</h1>
          <p>Here's your access link for <strong>${articleTitle}</strong>:</p>
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
Your Access Link

Here's your access link for ${articleTitle}:
${magicLink}

This link will expire in 30 days, but you can request a new one anytime if you've already paid.
  `.trim();
}

