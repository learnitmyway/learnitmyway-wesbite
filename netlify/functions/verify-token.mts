import type { Context } from '@netlify/functions';
import { validateToken } from './_shared/validate-token.mts';

interface VerifyTokenResponse {
  valid: boolean;
  expiresAt?: string;
}

async function extractParams(req: Request): Promise<{ articleSlug: string; token: string } | null> {
  try {
    const body = await req.json();
    const { articleSlug, token } = body;
    
    if (!articleSlug || !token) {
      return null;
    }
    
    return { articleSlug, token };
  } catch (error) {
    return null;
  }
}

export default async (req: Request, context: Context) => {
  console.log('🔍 Token verification request received');

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
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: articleSlug and token' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { articleSlug, token } = params;
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
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response: VerifyTokenResponse = {
      valid: true,
      expiresAt: result.tokenRecord.expiresAtUtc,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Token verification failed', details: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
