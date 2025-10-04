const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Shortcut: Grant access to anyone with the magic word
  const { email, courseId, magicWord } = JSON.parse(event.body || '{}');
  
  if (magicWord === 'unlock-premium') {
    // Generate a simple session token
    const sessionToken = `demo-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        sessionToken,
        email: email || 'demo@example.com',
        courseId,
        message: 'Access granted!'
      })
    };
  }
  
  return {
    statusCode: 401,
    body: JSON.stringify({ 
      error: 'Invalid magic word',
      hint: 'Use magicWord: "unlock-premium"' 
    })
  };
};
