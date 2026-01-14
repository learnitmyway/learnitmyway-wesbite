/**
 * Magic Link Verification
 * Validates magic link tokens and sets access cookies
 */
import type { Context } from "@netlify/functions";
import { getToken, isTokenValid } from "../../lib/kv-utils.ts";

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }

  try {
    const kv = context.kv;
    if (!kv) {
      throw new Error('KV store not available');
    }

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return redirectToError('Missing token parameter');
    }

    // Get token data from KV
    const tokenData = await getToken(kv, token);

    if (!tokenData || !isTokenValid(tokenData)) {
      return redirectToError('Invalid or expired token');
    }

    // Set secure HTTP-only cookie with token
    const cookieExpiry = new Date(tokenData.expiresAt);
    const cookie = `access_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${cookieExpiry.toUTCString()}`;

    // Redirect to the article (Hugo generates URLs like /post/article-slug/)
    const articleUrl = `/post/${tokenData.articleSlug}/`;
    
    return new Response(null, {
      status: 303,
      headers: {
        'Location': articleUrl,
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return redirectToError('An error occurred while verifying your access');
  }
};

function redirectToError(message: string) {
  // Redirect to a generic error page or back to home
  // You may want to customize this based on your site structure
  return new Response(null, {
    status: 303,
    headers: {
      'Location': `/?error=${encodeURIComponent(message)}`,
    },
  });
}

