# Stripe Paywall Implementation

A simple, clean paywall system using Stripe for payment processing. No database required - all purchase data is stored in Stripe.

## Features

✅ **Stripe Integration** - Secure payment processing  
✅ **No Database** - Queries Stripe API directly  
✅ **Cross-Device Access** - Verify with email on any device  
✅ **Zero Data Storage** - No user data stored on your site  
✅ **Simple Setup** - Just 2 Netlify Functions  
✅ **Mobile Responsive** - Works on all devices  

---

## How It Works

### User Flow

1. **Visit premium article** → Sees preview + paywall
2. **Click "Purchase"** → Enters email → Redirects to Stripe
3. **Pays on Stripe** → Redirects back with access
4. **Other device** → Enters email → Verifies with Stripe → Access granted

### Technical Flow

```
Frontend (Hugo) → Netlify Functions → Stripe API → Payment/Verification
```

**No database needed!** Stripe stores all purchase information.

---

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### 2. Set Environment Variables

**Local development** - Create `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
URL=http://localhost:8888
```

**Production** - In Netlify dashboard:
```
Site settings → Environment variables → Add:
- STRIPE_SECRET_KEY: sk_live_your_key_here
- URL: https://yoursite.com
```

### 3. Test Locally

```bash
# Start Netlify Dev (runs Hugo + Functions)
npx netlify dev
```

Visit: `http://localhost:8888/example-premium-article`

### 4. Test Purchase

Use Stripe test cards:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## Creating Premium Content

### Front Matter Configuration

**Free Article:**
```yaml
---
title: "My Free Article"
type: post
date: 2025-10-03
url: my-free-article
---
```

**Premium Article:**
```yaml
---
title: "My Premium Article"
type: post
date: 2025-10-03
url: my-premium-article
isPremium: true        # Enables paywall
courseId: "my-course"  # Unique ID for this content
priceUSD: 29          # Price in USD
---
```

### Content Structure

```markdown
---
# Front matter here
---

This first paragraph is the preview. It's visible to everyone.

<!--more-->

## Premium Content Starts Here

Everything after <!--more--> is hidden behind the paywall.
Only paying customers can see this content.
```

---

## File Structure

```
netlify/functions/
  ├── create-checkout.js    # Creates Stripe checkout session
  └── verify-access.js      # Verifies purchase via Stripe API

static/
  ├── css/paywall.css       # Paywall styling
  └── js/stripe-paywall.js  # Frontend logic

layouts/
  ├── _default/baseof.html  # Includes CSS/JS
  ├── post/single.html      # Shows paywall for premium posts
  └── partials/
      ├── paywall.html      # Paywall UI
      └── course-badge.html # Premium/Free badge

content/
  ├── post/
  │   ├── example-free-article.md
  │   └── example-premium-article.md
  └── purchase-success.md   # Post-purchase page
```

---

## API Endpoints

### Create Checkout Session

**POST** `/.netlify/functions/create-checkout`

```json
{
  "courseId": "example-course",
  "email": "user@example.com",
  "priceUSD": 29,
  "courseName": "Example Course"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### Verify Access

**POST** `/.netlify/functions/verify-access`

```json
{
  "email": "user@example.com",
  "courseId": "example-course"
}
```

**Response:**
```json
{
  "hasAccess": true,
  "email": "user@example.com",
  "source": "stripe"
}
```

---

## Customization

### Change Price

Update `priceUSD` in article front matter:
```yaml
priceUSD: 49  # Now $49 instead of $29
```

### Change Styling

Edit `static/css/paywall.css`:
```css
.btn-primary {
  background: #your-color;  /* Change button color */
}
```

### Change Benefits Text

Edit `layouts/partials/paywall.html`:
```html
<ul>
  <li>✓ Your custom benefit</li>
  <li>✓ Another benefit</li>
</ul>
```

### Add Metadata to Stripe

In `netlify/functions/create-checkout.js`, add more metadata:
```javascript
metadata: {
  courseId,
  email,
  // Add your custom fields:
  category: 'tutorial',
  difficulty: 'advanced'
}
```

---

## Testing

### Test Purchase Flow

1. Visit: `http://localhost:8888/example-premium-article`
2. Click "Purchase via Stripe"
3. Enter email: `test@example.com`
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Should redirect back with access

### Test Cross-Device Access

1. Open incognito window
2. Visit premium article
3. Click "Verify access"
4. Enter same email used for purchase
5. Content should unlock

### Clear Test Data

Browser console:
```javascript
clearEmail()  // Clears stored email
```

---

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Set `URL` environment variable to production domain
- [ ] Test purchase with real card (refund after)
- [ ] Test email verification
- [ ] Set up Stripe webhook (optional, for notifications)
- [ ] Add GDPR-compliant privacy policy
- [ ] Consider adding receipt emails via Stripe

---

## Stripe Webhook (Optional)

For post-purchase actions (emails, analytics, etc.):

### 1. Create Webhook Endpoint

```javascript
// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
  
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    // Send confirmation email
    // Update analytics
    // etc.
    
    console.log('Purchase:', session.customer_email, session.metadata.courseId);
  }
  
  return { statusCode: 200, body: 'Success' };
};
```

### 2. Configure in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yoursite.com/.netlify/functions/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy webhook secret to environment variables

---

## FAQ

**Q: Do I need a database?**  
A: No! Stripe stores all purchase data. We query their API.

**Q: What if Stripe is down?**  
A: Users won't be able to verify purchases until it's back up. But Stripe has 99.99% uptime.

**Q: Can users share access?**  
A: Technically yes - anyone with the email can verify. But that's also true with Netflix, etc. Most users won't abuse it.

**Q: What about GDPR?**  
A: You store no user data. Stripe is GDPR compliant. Just mention it in your privacy policy.

**Q: Can I offer subscriptions?**  
A: Yes! Change `mode: 'payment'` to `mode: 'subscription'` in create-checkout.js

**Q: Can I bundle multiple articles?**  
A: Yes! Use the same `courseId` for multiple articles. One purchase unlocks all.

**Q: Transaction fees?**  
A: Stripe charges 2.9% + 30¢ per transaction. No monthly fees.

---

## Support

**Issues with setup?**
- Check environment variables are set
- Verify Stripe keys are correct (test keys for testing)
- Check browser console for errors
- Check Netlify Functions logs

**Need help?**
- Stripe docs: [https://stripe.com/docs](https://stripe.com/docs)
- Netlify Functions: [https://docs.netlify.com/functions/overview/](https://docs.netlify.com/functions/overview/)

---

## License

This paywall implementation is provided as-is for use in your projects.
