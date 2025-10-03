// Netlify Function: Verify Purchase Access
// This checks if an email has purchased a specific course via Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, courseId } = JSON.parse(event.body);

    // Validate input
    if (!email || !courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Look up customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasAccess: false }),
      };
    }

    const customer = customers.data[0];

    // Check payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 100,
    });

    // Check if any successful payment has this courseId in metadata
    const hasPurchased = paymentIntents.data.some(
      (payment) =>
        payment.status === 'succeeded' &&
        payment.metadata.courseId === courseId
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hasAccess: hasPurchased }),
    };
  } catch (error) {
    console.error('Access verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to verify access',
        details: error.message 
      })
    };
  }
};
