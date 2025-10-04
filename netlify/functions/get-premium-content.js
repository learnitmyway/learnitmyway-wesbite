const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  try {
    const { sessionToken, courseId } = JSON.parse(event.body || '{}');
    
    if (!sessionToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No session token provided' })
      };
    }
    
    if (!courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No courseId provided' })
      };
    }
    
    // Shortcut: Accept any token longer than 10 chars
    if (sessionToken.length <= 10) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid session' })
      };
    }
    
    // Get premium content from Netlify Blobs
    const siteID = process.env.SITE_ID || context.siteId;
    const contentStore = getStore({
      name: 'premium-content',
      siteID: siteID,
    });
    
    const content = await contentStore.get(courseId);
    
    if (!content) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Premium content not found',
          hint: 'Run the build script to extract premium content to Blobs'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        courseId
      })
    };
    
  } catch (error) {
    console.error('Error fetching premium content:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch premium content',
        details: error.message 
      })
    };
  }
};
