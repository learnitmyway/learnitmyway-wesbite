// Netlify Function: Create Stripe Checkout Session
// After successful payment, redirects to success page which triggers magic link

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
    const { courseId, email, priceUSD, courseName } = JSON.parse(event.body);

    // Validate input
    if (!courseId || !email || !priceUSD || !courseName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Validate email format
    if (!email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: courseName,
              description: `Premium access to ${courseName}`,
            },
            unit_amount: Math.round(parseFloat(priceUSD) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL}/purchase-success?email=${encodeURIComponent(email)}&courseId=${courseId}`,
      cancel_url: `${process.env.URL}${event.headers.referer ? new URL(event.headers.referer).pathname : '/'}`,
      metadata: {
        courseId,
        email,
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error) {
    console.error('Checkout creation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      })
    };
  }
};
