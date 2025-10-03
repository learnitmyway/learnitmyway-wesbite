// Netlify Function: Send Magic Link
// Generates a secure token and emails it to the user

const { getStore } = require('@netlify/blobs');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, courseId, courseName } = JSON.parse(event.body);

    // Validate input
    if (!email || !courseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Rate limiting: Check recent attempts
    const store = getStore('magic-links');
    // TODO: is this part of Netlify?
    const rateLimitKey = `rate:${email}`;
    const attempts = await store.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) >= 5) {
      return {
        statusCode: 429,
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again in an hour.' 
        })
      };
    }

    // Check if user has purchased this course (verify with Stripe)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No purchase found for this email' })
      };
    }

    const customer = customers.data[0];
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 100,
    });

    const hasPurchased = paymentIntents.data.some(
      (payment) =>
        payment.status === 'succeeded' &&
        payment.metadata.courseId === courseId
    );

    if (!hasPurchased) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'No purchase found for this course. Please check your email or purchase the course.' 
        })
      };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

    // Store token in Netlify Blobs
    const tokenData = {
      email,
      courseId,
      expiresAt,
      used: false,
    };
    
    await store.setJSON(token, tokenData);

    // Increment rate limit counter
    const currentAttempts = parseInt(attempts || '0') + 1;
    await store.set(rateLimitKey, currentAttempts.toString(), {
      metadata: { ttl: 3600 } // 1 hour TTL
    });

    // Create magic link
    const magicLink = `${process.env.URL}/verify?token=${token}&courseId=${courseId}`;

    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL, // Must be verified in SendGrid
      subject: `Access your premium content: ${courseName || courseId}`,
      text: `Click this link to access your premium content: ${magicLink}\n\nThis link expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Magic Link is Ready! 🎉</h2>
          <p>Click the button below to access your premium content:</p>
          <div style="margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: #635bff; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;
                      font-weight: 600;">
              Access Premium Content
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <code style="background: #f5f5f5; padding: 5px 10px; display: inline-block; margin-top: 5px;">
              ${magicLink}
            </code>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link expires in 15 minutes and can only be used once.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Magic link sent! Check your email.',
      }),
    };
  } catch (error) {
    console.error('Send magic link error:', error);
    
    // Handle SendGrid specific errors
    if (error.code === 403) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Email service not configured. Please contact support.' 
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send magic link',
        details: error.message 
      })
    };
  }
};
