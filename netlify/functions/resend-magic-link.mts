import type { Context } from '@netlify/functions';
import { getPaymentRecord } from './_shared/payment-storage.mts';
import { storeToken } from './_shared/token-storage.mts';
import { generateMagicLink } from './_shared/magic-link.mts';
import { getRequestBaseUrl } from './_shared/request-utils.mts';
import { sendMagicLinkEmail } from './_shared/email.mts';

interface ResendMagicLinkRequestBody {
  email?: string;
  articleSlug?: string;
}

interface ResendMagicLinkResponseBody {
  success: boolean;
  error?: string;
}

async function extractParams(req: Request): Promise<{ email: string; articleSlug: string } | null> {
  try {
    const body = (await req.json()) as ResendMagicLinkRequestBody;
    const email = body.email?.toLowerCase().trim();
    const articleSlug = body.articleSlug?.trim();

    if (!email || !articleSlug) {
      return null;
    }

    return { email, articleSlug };
  } catch (error) {
    console.error('❌ Failed to parse resend request body:', error);
    return null;
  }
}

export default async (req: Request, context: Context) => {
  console.log('📨 Resend magic link request received');

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const params = await extractParams(req);

    if (!params) {
      console.error('❌ Missing required parameters in resend request');
      const responseBody: ResendMagicLinkResponseBody = {
        success: false,
        error: 'Missing required parameters: email and articleSlug',
      };
      return new Response(JSON.stringify(responseBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, articleSlug } = params;
    console.log('📄 Article slug (resend):', articleSlug);
    console.log('📧 Email (resend):', email);

    // Check that a payment exists for this email + articleSlug
    let paymentRecord;
    try {
      paymentRecord = await getPaymentRecord(email, articleSlug);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to lookup payment record for resend:', message);
      const responseBody: ResendMagicLinkResponseBody = {
        success: false,
        error: 'Unable to verify purchase for resend request',
      };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!paymentRecord) {
      console.log('ℹ️ No payment record found for resend request');
      // Privacy-friendly: do not reveal whether a payment exists; generic failure
      const responseBody: ResendMagicLinkResponseBody = {
        success: false,
        error: 'Unable to resend access link. Please check your details or try purchasing again.',
      };
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Always create a fresh token for resend; existing tokens remain valid until expiry
    const tokenUuid = crypto.randomUUID();
    const tokenExpirationDays = 30;
    const expiresAtUtc = new Date();
    expiresAtUtc.setDate(expiresAtUtc.getDate() + tokenExpirationDays);
    const expiresAtUtcString = expiresAtUtc.toISOString();

    try {
      await storeToken({
        articleSlug,
        uuid: tokenUuid,
        email,
        expiresAtUtc: expiresAtUtcString,
      });
      console.log('✅ Resend token stored successfully');
      console.log('🔑 Resend token UUID:', tokenUuid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to store resend token:', message);
      const responseBody: ResendMagicLinkResponseBody = {
        success: false,
        error: 'Failed to create access token for resend request',
      };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = getRequestBaseUrl(req);
    const magicLink = generateMagicLink(baseUrl, articleSlug, tokenUuid);
    console.log('🔗 Resend magic link:', magicLink);

    try {
      await sendMagicLinkEmail({ to: email, magicLink, articleSlug });
      console.log('✅ Resend magic link email sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send resend magic link email:', message);
      const responseBody: ResendMagicLinkResponseBody = {
        success: false,
        error: 'Failed to send access email. Please try again later.',
      };
      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseBody: ResendMagicLinkResponseBody = { success: true };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Resend magic link error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const responseBody: ResendMagicLinkResponseBody = {
      success: false,
      error: 'Resend magic link request failed',
    };
    return new Response(JSON.stringify(responseBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

