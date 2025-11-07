/**
 * Access Check Function
 * Checks if user has access to premium content, with auto-renewal for expired tokens
 */
import type { Context } from "@netlify/functions";
import { getToken, isTokenValid, getPaymentRecord, storeToken, generateToken } from "../../lib/kv-utils.ts";

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const kv = context.kv;
    if (!kv) {
      throw new Error('KV store not available');
    }

    // Get article slug from query parameter or request body
    const url = new URL(req.url);
    let articleSlug = url.searchParams.get('articleSlug');
    
    if (!articleSlug && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      articleSlug = body.articleSlug;
    }

    if (!articleSlug) {
      return new Response(JSON.stringify({ hasAccess: false, error: 'Missing articleSlug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get token from cookie
    const cookies = req.headers.get('Cookie') || '';
    const tokenMatch = cookies.match(/access_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    let hasAccess = false;
    let tokenData = null;

    if (token) {
      tokenData = await getToken(kv, token);
      hasAccess = isTokenValid(tokenData);
    }

    // If token expired or missing, check payment record and auto-renew
    if (!hasAccess) {
      // Try to get email from token data if available (even if expired)
      let email: string | null = null;
      if (tokenData) {
        email = tokenData.email;
      }

      // If we don't have email, we can't check payment record
      // User will need to use resend-magic-link endpoint
      if (email) {
        const paymentRecord = await getPaymentRecord(kv, email, articleSlug);
        
        if (paymentRecord) {
          // Payment record exists, generate new token
          const newToken = generateToken();
          await storeToken(kv, newToken, email, articleSlug);
          
          // Set new cookie
          const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
          const cookieExpiry = new Date(expiresAt);
          const cookie = `access_token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${cookieExpiry.toUTCString()}`;
          
          return new Response(JSON.stringify({ hasAccess: true, tokenRenewed: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': cookie,
            },
          });
        }
      }
    } else {
      // Token is valid, return success
      return new Response(JSON.stringify({ hasAccess: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No access
    return new Response(JSON.stringify({ hasAccess: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking access:', error);
    return new Response(JSON.stringify({ hasAccess: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

