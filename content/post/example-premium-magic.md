---
title: "Example Premium Article with Magic Link"
type: post
date: 2025-10-03
excerpt: This premium article demonstrates the magic link paywall system. The first paragraph is free, but the rest requires purchase and email verification.
url: example-premium-magic
canonical: true
courseId: "example-course"
isPremium: true
priceUSD: 29
---

This is the preview/summary of the premium article. This first paragraph is visible to everyone and serves as a teaser for the full content. Purchase the article and receive a magic link via email to unlock the full content on any device.

<!--more-->

## This is Premium Content

If you're seeing this section, you've successfully verified your purchase via magic link!

### How the Magic Link System Works

1. **Purchase**: Enter your email and complete payment via Stripe
2. **Magic Link Sent**: We automatically send a secure link to your email
3. **Click Link**: Open your email and click the magic link
4. **Access Granted**: Content unlocks and stays unlocked on that device
5. **Other Devices**: Request a new magic link anytime

### Security Features

✓ **Token expiration** - Links expire after 15 minutes  
✓ **Single-use tokens** - Each link can only be used once  
✓ **Session-based access** - 30-day sessions after verification  
✓ **Rate limiting** - Maximum 5 requests per hour per email  
✓ **Email ownership verified** - Only the email owner can access  

### Benefits Over Simple Email Verification

The magic link approach provides better security than the simple email-only system:

- **Proves email ownership** - Users must have access to the inbox
- **Time-limited** - Tokens can't be shared indefinitely
- **Prevents sharing** - Each magic link is single-use
- **Still cross-device** - Request new links on any device
- **No passwords** - Completely passwordless experience

### Technical Stack

- **Stripe** - Payment processing and customer verification
- **Netlify Blobs** - Serverless key-value storage for tokens
- **SendGrid** - Reliable email delivery (100/day free tier)
- **No database** - Everything stored in Netlify Blobs or Stripe

## Full Premium Content

This is where you'd put your full premium content - tutorials, courses, in-depth guides, etc.

The system is designed to be:
- **User-friendly** - Simple purchase and verification flow
- **Secure** - Email verification with expiring tokens
- **Cost-effective** - Free tiers for both storage and email
- **Scalable** - Handles abuse without surprise bills

Perfect for indie creators who want basic security without complexity!
