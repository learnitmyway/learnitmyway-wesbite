# Magic Link Paywall System

A secure, serverless paywall system using Stripe payments with email-verified magic links.

## Features

- ✅ **Magic Link Authentication** - Secure, passwordless access via email
- ✅ **Stripe Payments** - One-time payments, no subscriptions
- ✅ **Cross-Device Access** - Request magic links on any device
- ✅ **No Database** - Uses Netlify Blobs for token storage
- ✅ **Free Tiers** - SendGrid (100 emails/day) + Netlify Blobs (1GB)
- ✅ **Abuse Protection** - Rate limiting, token expiration, single-use tokens
- ✅ **Session Management** - 30-day sessions after verification

## Architecture

```
Purchase Flow:
User → Stripe Checkout → Payment Success → Magic Link Email → Verify Token → Access Granted

Returning User:
User → "Get Magic Link" → Email → Verify Token → Session Created → Access Granted
```

## Quick Start

### 1. Get API Keys

**Stripe (Test Mode):**
1. Visit https://dashboard.stripe.com/test/apikeys
2. Copy your "Secret key" (starts with `sk_test_`)

**SendGrid:**
1. Visit https://app.sendgrid.com/settings/api_keys
2. Create new API key with "Mail Send" permissions
3. Verify a sender email at https://app.sendgrid.com/settings/sender_auth

### 2. Configure Environment

Create `.env` file (copy from `.env.example`):

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
SENDGRID_API_KEY=SG.your_key_here
FROM_EMAIL=noreply@yourdomain.com
URL=http://localhost:8888
```

### 3. Install Dependencies

```bash
npm install
```

Packages installed:
- `stripe` - Stripe API client
- `@netlify/blobs` - Serverless storage
- `@sendgrid/mail` - Email delivery

### 4. Start Development Server

```bash
npx netlify dev
```

This starts both Hugo and Netlify Functions locally.

### 5. Test the System

1. Visit http://localhost:8888/example-premium-magic
2. Click "Purchase via Stripe"
3. Enter your email (the one you verified in SendGrid)
4. Use test card: `4242 4242 4242 4242`
5. Complete purchase
6. Check your email for magic link
7. Click the link to verify and unlock content

## How to Use

### Create Premium Content

Add to your article's front matter:

```yaml
---
title: "My Premium Article"
isPremium: true
courseId: "my-course-id"
priceUSD: 29
---

This is the free preview shown to everyone.

<!--more-->

This content is locked behind the paywall.
```

### Customize the Paywall

Edit `layouts/partials/paywall.html` to change:
- Benefits list
- Pricing display
- Button text
- Styling

### Change Token Expiration

In `netlify/functions/send-magic-link.js`:

```javascript
const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
```

In `netlify/functions/verify-magic-link.js`:

```javascript
expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
```

### Adjust Rate Limiting

In `netlify/functions/send-magic-link.js`:

```javascript
if (attempts && parseInt(attempts) >= 5) { // 5 attempts
  // ...
}

await store.set(rateLimitKey, currentAttempts.toString(), {
  metadata: { ttl: 3600 } // 1 hour window
});
```

## Cost Analysis

### Free Tier Limits

**SendGrid:**
- 100 emails/day (3,000/month)
- No credit card required
- Hard limit - won't exceed

**Netlify Blobs:**
- 1GB storage
- 1GB bandwidth/month
- Hard limit - won't exceed

### Abuse Scenario (100K requests)

**With Free Tiers:**
- SendGrid blocks after 100/day = $0 (protected)
- Netlify Blobs caps at 1GB = $0 (protected)
- **Total worst case: $0**

**If You Upgrade:**
- SendGrid: $40-80 for 100K emails
- Netlify Blobs: ~$50 for 100GB
- **Total: ~$90-130** (still affordable)

### Cost Optimization Tips

1. **Block disposable emails** to reduce fake requests
2. **Verify purchases before sending** magic links
3. **Set aggressive rate limits** (5 per hour)
4. **Monitor SendGrid dashboard** for unusual activity
5. **Start with free tiers** - upgrade when needed

## Security Features

### Token Security

- **Cryptographically random** - 32-byte tokens
- **Single-use** - Marked as used after verification
- **Time-limited** - 15-minute expiration
- **Stored securely** - Netlify Blobs with metadata

### Rate Limiting

- Max 5 magic link requests per hour per email
- Counter stored in Netlify Blobs with TTL
- Prevents spam and abuse

### Email Verification

- Users must access their inbox to get the link
- Proves email ownership
- Prevents account sharing

### Session Management

- 30-day sessions after verification
- Stored in localStorage
- Can be revoked by clearing session

## Production Deployment

### 1. Update Netlify Environment Variables

Go to: **Site settings → Environment variables**

Add:
```
STRIPE_SECRET_KEY=sk_live_your_live_key
SENDGRID_API_KEY=SG.your_production_key
FROM_EMAIL=noreply@yourdomain.com
URL=https://yoursite.com
```

### 2. Verify SendGrid Domain

For production, verify your domain in SendGrid:
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Domain"
3. Add DNS records to your domain
4. Use domain email as FROM_EMAIL

### 3. Test with Stripe Test Mode

Before going live:
1. Deploy with test keys
2. Make test purchases
3. Verify magic links work
4. Check email delivery

### 4. Switch to Live Mode

1. Replace with live Stripe keys
2. Update environment variables in Netlify
3. Deploy

### 5. Monitor

- **Stripe Dashboard** - View payments
- **SendGrid Dashboard** - Email delivery stats
- **Netlify Functions** - Check logs for errors

## Troubleshooting

### Magic Link Not Received

1. Check spam folder
2. Verify FROM_EMAIL in SendGrid
3. Check SendGrid activity feed
4. Ensure email isn't on suppression list

### "No purchase found" Error

1. Verify payment succeeded in Stripe
2. Check customer email matches exactly
3. Ensure courseId in metadata matches
4. Wait a few seconds after payment

### Token Expired

- Links expire in 15 minutes
- Request a new magic link
- Consider extending expiration time

### Rate Limit Hit

- Wait 1 hour
- Or clear rate limit in Netlify Blobs
- Adjust limit in code if needed

## Development Commands

```bash
# Start dev server
npx netlify dev

# Clear session (in browser console)
clearSession()

# Test magic link flow
# 1. Make purchase
# 2. Check email
# 3. Click link
# 4. Verify access granted

# Build for production
hugo --minify
```

## Files Overview

**Netlify Functions:**
- `netlify/functions/create-checkout.js` - Create Stripe session
- `netlify/functions/send-magic-link.js` - Generate & send magic links
- `netlify/functions/verify-magic-link.js` - Verify tokens, create sessions
- `netlify/functions/verify-session.js` - Check session validity

**Frontend:**
- `static/js/magic-link-paywall.js` - Client-side logic
- `static/css/paywall.css` - Paywall styling

**Hugo Templates:**
- `layouts/partials/paywall.html` - Paywall UI
- `layouts/partials/course-badge.html` - Premium badges
- `layouts/post/single.html` - Article template with paywall
- `layouts/_default/baseof.html` - Base template with scripts

**Content:**
- `content/post/example-premium-magic.md` - Example article
- `content/purchase-success.md` - Post-purchase page
- `content/verify.md` - Magic link verification page

## Support

For issues:
1. Check Netlify Functions logs
2. Check SendGrid activity feed
3. Check Stripe dashboard
4. Review browser console for errors

## License

Same as main project.
