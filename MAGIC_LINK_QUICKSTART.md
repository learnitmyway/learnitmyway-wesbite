# Magic Link Paywall - Quick Reference

## What You Have

A complete magic link authentication system for premium content with:
- Stripe payments
- Email-verified access via magic links
- Netlify Blobs storage (no database)
- SendGrid email delivery
- Rate limiting & abuse protection

## Setup (5 minutes)

### 1. Get API Keys

**Stripe:** https://dashboard.stripe.com/test/apikeys
- Copy "Secret key" (sk_test_...)

**SendGrid:** https://app.sendgrid.com/settings/api_keys
- Create API key with "Mail Send" permission
- Verify sender email at https://app.sendgrid.com/settings/sender_auth

### 2. Configure .env

```bash
cp .env.example .env
```

Edit `.env`:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
SENDGRID_API_KEY=SG.YOUR_KEY
FROM_EMAIL=your-verified@email.com
URL=http://localhost:8888
```

### 3. Start Server

```bash
npx netlify dev
```

### 4. Test

1. Visit http://localhost:8888/example-premium-magic
2. Purchase with test card: `4242 4242 4242 4242`
3. Check email for magic link
4. Click link → content unlocked!

## How It Works

```
┌─────────────┐
│   User      │
│  Clicks     │
│  Purchase   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stripe    │
│  Checkout   │
└──────┬──────┘
       │ Payment Success
       ▼
┌─────────────┐
│ Magic Link  │
│   Sent to   │
│   Email     │
└──────┬──────┘
       │ User clicks link
       ▼
┌─────────────┐
│   Verify    │
│   Token     │
│  + Create   │
│  Session    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Content    │
│  Unlocked!  │
└─────────────┘
```

## Create Premium Content

```yaml
---
title: "My Article"
isPremium: true
courseId: "my-course"
priceUSD: 29
---

Free preview text here.

<!--more-->

Premium content here (locked).
```

## Key Features

### Security
- ✅ 15-minute token expiration
- ✅ Single-use magic links
- ✅ 30-day sessions
- ✅ Rate limiting (5/hour)
- ✅ Email ownership verified

### Cost Protection
- ✅ SendGrid: 100 emails/day (hard limit)
- ✅ Netlify Blobs: 1GB storage (hard limit)
- ✅ **100K abuse = $0** (blocked at free tier)

### User Experience
- ✅ Passwordless authentication
- ✅ Cross-device access
- ✅ One-click magic links
- ✅ No account creation needed
- ✅ Automatic email after purchase

## File Structure

```
netlify/functions/
  ├── create-checkout.js      # Stripe checkout
  ├── send-magic-link.js      # Generate & send links
  ├── verify-magic-link.js    # Verify tokens
  └── verify-session.js       # Check sessions

static/
  ├── js/magic-link-paywall.js  # Frontend logic
  └── css/paywall.css           # Styling

layouts/
  ├── partials/
  │   ├── paywall.html        # Paywall UI
  │   └── course-badge.html   # Premium badges
  └── post/single.html        # Article template

content/
  ├── purchase-success.md     # Post-purchase page
  ├── verify.md               # Verification page
  └── post/
      └── example-premium-magic.md  # Demo article
```

## Common Tasks

### Clear Your Session (for testing)
```javascript
// In browser console:
clearSession()
```

### Change Token Expiration
```javascript
// netlify/functions/send-magic-link.js line ~57
const expiresAt = Date.now() + (15 * 60 * 1000); // Change 15
```

### Adjust Rate Limit
```javascript
// netlify/functions/send-magic-link.js line ~46
if (attempts && parseInt(attempts) >= 5) { // Change 5
```

### Change Session Duration
```javascript
// netlify/functions/verify-magic-link.js line ~70
expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // Change 30
```

## Production Deployment

1. **Get Live Keys:**
   - Stripe: https://dashboard.stripe.com/apikeys
   - SendGrid: Production API key

2. **Set Netlify Env Vars:**
   ```
   Site settings → Environment variables
   STRIPE_SECRET_KEY=sk_live_...
   SENDGRID_API_KEY=SG...
   FROM_EMAIL=noreply@yourdomain.com
   URL=https://yoursite.com
   ```

3. **Verify Domain in SendGrid**
   - Add DNS records
   - Use domain email as FROM_EMAIL

4. **Deploy:**
   ```bash
   git push origin master
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check spam, verify FROM_EMAIL in SendGrid |
| "No purchase found" | Wait 30s after payment, check Stripe dashboard |
| Token expired | Request new link (expires in 15 min) |
| Rate limit hit | Wait 1 hour or adjust in code |

## Cost Calculator

**Free Tier (3,000 emails/month):**
- Perfect for getting started
- Hard limit prevents surprises
- $0/month

**Paid Tier (if you exceed):**
- SendGrid: $20/mo for 50K emails ($0.40 per 1K)
- Netlify Blobs: First 1GB free, then $0.50/GB
- Example: 10K emails = $20/mo

## Support

See **MAGIC_LINK_README.md** for complete documentation.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure .env with your keys
3. ✅ Start dev server: `npx netlify dev`
4. ✅ Test purchase flow
5. ✅ Customize styling in `static/css/paywall.css`
6. ✅ Create your first premium article
7. ✅ Deploy to production!
