import type { Context } from '@netlify/functions';
import { validateToken } from './_shared/validate-token.mts';

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

    const result = await validateToken(articleSlug, token);

    if (!result.success) {
      if (result.status === 500) {
        return new Response(
          JSON.stringify({ error: 'Failed to verify token' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      const errorMessage =
        result.reason === 'expired' ? 'Token has expired' : 'Invalid token';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expiresAt = new Date(result.tokenRecord.expiresAtUtc);

    // Set cookie with articleSlug as name and token as value
    // Cookie expires at the same time as the token
    const cookieExpires = expiresAt.toUTCString();
    const cookieValue = `${articleSlug}=${token}; Secure; SameSite=Lax; Expires=${cookieExpires}; Path=/`;

    // Redirect to article page
    // Netlify automatically appends the original query string to the redirect url if we don't override it
    const articleUrl = `/${articleSlug}?redirected=true`;

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
