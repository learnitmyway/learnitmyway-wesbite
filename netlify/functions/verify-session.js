// Netlify Function: Verify Session Token
// Checks if a session token is valid and grants access

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionToken, courseId } = JSON.parse(event.body);

    // Validate input
    if (!sessionToken || !courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get session from Netlify Blobs
    const store = getStore('sessions');
    const sessionData = await store.get(sessionToken, { type: 'json' });

    if (!sessionData) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasAccess: false }),
      };
    }

    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      // Clean up expired session
      await store.delete(sessionToken);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasAccess: false }),
      };
    }

    // Verify courseId matches
    if (sessionData.courseId !== courseId) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasAccess: false }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        hasAccess: true,
        email: sessionData.email,
      }),
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to verify session',
        details: error.message 
      })
    };
  }
};
