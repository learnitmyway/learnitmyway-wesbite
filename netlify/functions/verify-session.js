const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Simple session verification (shortcut - just checks if token exists)
  const { sessionToken } = JSON.parse(event.body || '{}');
  
  if (!sessionToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ hasAccess: false, error: 'No session token' })
    };
  }
  
  // Shortcut: Accept any non-empty token as valid
  // In real implementation, this would check Netlify Blobs/database
  const hasAccess = sessionToken.length > 10;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hasAccess,
      email: hasAccess ? 'demo@example.com' : null
    })
  };
};
