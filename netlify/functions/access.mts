import type { Context } from '@netlify/functions';
import { getToken } from './_shared/token-storage.mts';
import { getRequestBaseUrl } from './_shared/request-utils.mts';

export default async (req: Request, context: Context) => {
  console.log('🔗 Magic link access request received');

  if (req.method !== 'GET') {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract query parameters
    const url = new URL(req.url);
    const articleSlug = url.searchParams.get('article');
    const token = url.searchParams.get('token');

    if (!articleSlug || !token) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: article and token' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📄 Article slug:', articleSlug);
    console.log('🔑 Token UUID:', token);

    // Retrieve and verify token record
    let tokenRecord;
    try {
      tokenRecord = await getToken(articleSlug, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to retrieve token:', message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify token' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!tokenRecord) {
      console.log('❌ Token not found');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expiresAtUtc);
    const isExpired = now >= expiresAt;

    if (isExpired) {
      console.log('❌ Token is expired');
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Token is valid');

    // Set cookie with articleSlug as name and token as value
    // Cookie expires at the same time as the token
    const cookieExpires = expiresAt.toUTCString();
    const cookieValue = `${articleSlug}=${token}; HttpOnly; Secure; SameSite=Lax; Expires=${cookieExpires}; Path=/`;

    // Redirect to article page with absolute URL (ensures token is removed from URL)
    const baseUrl = getRequestBaseUrl(req);
    const articleUrl = `${baseUrl}/${articleSlug}/`;

    console.log('🍪 Setting cookie and redirecting to:', articleUrl);

    return new Response(null, {
      status: 303,
      headers: {
        'Location': articleUrl,
        'Set-Cookie': cookieValue,
      },
    });
  } catch (error) {
    console.error('❌ Access handler error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Access handler failed', details: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
