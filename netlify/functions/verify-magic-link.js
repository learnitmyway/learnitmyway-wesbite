// Netlify Function: Verify Magic Link Token
// Validates the token and creates a session token for the user

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, courseId } = JSON.parse(event.body);

    // Validate input
    if (!token || !courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get token from Netlify Blobs
    const store = getStore('magic-links');
    const tokenData = await store.get(token, { type: 'json' });

    if (!tokenData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Invalid or expired link. Please request a new one.' 
        })
      };
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      // Clean up expired token
      await store.delete(token);
      return {
        statusCode: 410,
        body: JSON.stringify({ 
          error: 'This link has expired. Please request a new one.' 
        })
      };
    }

    // Check if token was already used
    if (tokenData.used) {
      return {
        statusCode: 410,
        body: JSON.stringify({ 
          error: 'This link has already been used. Please request a new one.' 
        })
      };
    }

    // Verify courseId matches
    if (tokenData.courseId !== courseId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Invalid token for this course.' 
        })
      };
    }

    // Mark token as used
    tokenData.used = true;
    await store.setJSON(token, tokenData);

    // Generate session token (long-lived, for localStorage)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      email: tokenData.email,
      courseId: tokenData.courseId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };

    const sessionStore = getStore('sessions');
    await sessionStore.setJSON(sessionToken, sessionData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        sessionToken,
        email: tokenData.email,
        courseId: tokenData.courseId,
      }),
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to verify token',
        details: error.message 
      })
    };
  }
};
