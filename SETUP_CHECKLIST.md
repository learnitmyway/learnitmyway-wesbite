# 🎯 Magic Link Paywall - Setup Checklist

Use this checklist to get your paywall system up and running!

## ✅ Installation (Already Done)

- [x] Netlify Functions created
- [x] Frontend JavaScript and CSS created
- [x] Hugo templates updated
- [x] Example content created
- [x] Dependencies installed (`stripe`, `@netlify/blobs`, `@sendgrid/mail`)
- [x] Documentation written

## 📋 Your Next Steps

### 1. Get Stripe Test Keys (5 minutes)

- [ ] Go to https://dashboard.stripe.com/test/apikeys
- [ ] Sign up or log in to Stripe
- [ ] Copy your "Secret key" (starts with `sk_test_`)
- [ ] Save it somewhere safe (you'll need it in step 3)

### 2. Get SendGrid API Key (5 minutes)

- [ ] Go to https://app.sendgrid.com/settings/api_keys
- [ ] Sign up or log in to SendGrid (free account)
- [ ] Click "Create API Key"
- [ ] Give it a name like "paywall-magic-links"
- [ ] Select "Full Access" or at minimum "Mail Send" permission
- [ ] Copy the API key (you only see it once!)
- [ ] Save it somewhere safe

**Important:** Verify your sender email:
- [ ] Go to https://app.sendgrid.com/settings/sender_auth
- [ ] Click "Verify a Single Sender"
- [ ] Enter your email address (can be personal email for testing)
- [ ] Check your email and click the verification link
- [ ] Wait for "Verified" status

### 3. Configure Environment Variables (2 minutes)

- [ ] In the project root, copy `.env.example` to `.env`:
  ```bash
  cp .env.example .env
  ```

- [ ] Edit `.env` and add your keys:
  ```bash
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY_FROM_STEP_1
  SENDGRID_API_KEY=SG.YOUR_KEY_FROM_STEP_2
  FROM_EMAIL=the-email-you-verified@example.com
  URL=http://localhost:8888
  ```

- [ ] Save the file

### 4. Start Development Server (1 minute)

- [ ] Run this command:
  ```bash
  npx netlify dev
  ```

- [ ] Wait for server to start
- [ ] You should see: "Server now ready on http://localhost:8888"

### 5. Test the Complete Flow (5 minutes)

- [ ] Open http://localhost:8888/example-premium-magic in your browser
- [ ] You should see:
  - [ ] Article preview (first paragraph)
  - [ ] Paywall card with price ($29)
  - [ ] "Purchase via Stripe" button
  - [ ] "Already purchased? Get magic link" button

- [ ] Click "Purchase via Stripe"
- [ ] Enter your email (use the one you verified in SendGrid)
- [ ] You'll be redirected to Stripe checkout

- [ ] On Stripe checkout page, use test card:
  - Card number: `4242 4242 4242 4242`
  - Expiry: Any future date (e.g., `12/25`)
  - CVC: Any 3 digits (e.g., `123`)
  - ZIP: Any 5 digits (e.g., `12345`)

- [ ] Complete the payment
- [ ] You'll be redirected to purchase success page
- [ ] Check your email inbox (the verified email)
- [ ] You should receive an email with subject "Access your premium content"
- [ ] Click the magic link in the email
- [ ] You should be redirected to the article
- [ ] The paywall should disappear
- [ ] The full content should be visible
- [ ] You should see a success notification

### 6. Test Cross-Device Access (Optional - 2 minutes)

- [ ] Open the same article in a private/incognito window (or different browser)
- [ ] You should see the paywall again (different "device")
- [ ] Click "Already purchased? Get magic link"
- [ ] Enter the same email you used to purchase
- [ ] Check your email for the new magic link
- [ ] Click the link
- [ ] Content should unlock in this window too

### 7. Test Session Persistence (Optional - 1 minute)

- [ ] Close and reopen your browser
- [ ] Visit the article again
- [ ] Content should still be unlocked (session saved in localStorage)
- [ ] Open browser console (F12)
- [ ] Type `clearSession()` and press Enter
- [ ] Refresh the page
- [ ] Paywall should reappear (session cleared)

## 🎨 Customization (Optional)

### Change the Price

- [ ] Edit `content/post/example-premium-magic.md`
- [ ] Change `priceUSD: 29` to your desired price
- [ ] Save and refresh

### Create Your First Real Premium Article

- [ ] Create a new file: `content/post/my-premium-article.md`
- [ ] Add this front matter:
  ```yaml
  ---
  title: "My Premium Article"
  type: post
  date: 2025-10-03
  excerpt: A short description
  url: my-premium-article
  canonical: true
  isPremium: true
  courseId: "my-course"
  priceUSD: 29
  ---
  
  This is the free preview that everyone can see.
  
  <!--more-->
  
  This is the premium content that only paying customers can see.
  ```
- [ ] Save and visit http://localhost:8888/my-premium-article

### Customize the Paywall Appearance

- [ ] Edit `static/css/paywall.css` to change colors, fonts, spacing
- [ ] Edit `layouts/partials/paywall.html` to change text, benefits list
- [ ] Changes appear immediately (just refresh browser)

### Adjust Security Settings

**Change magic link expiration (default: 15 minutes):**
- [ ] Edit `netlify/functions/send-magic-link.js`
- [ ] Find line ~57: `const expiresAt = Date.now() + (15 * 60 * 1000);`
- [ ] Change `15` to desired minutes

**Change session duration (default: 30 days):**
- [ ] Edit `netlify/functions/verify-magic-link.js`
- [ ] Find line ~70: `expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)`
- [ ] Change `30` to desired days

**Change rate limit (default: 5 per hour):**
- [ ] Edit `netlify/functions/send-magic-link.js`
- [ ] Find line ~46: `if (attempts && parseInt(attempts) >= 5)`
- [ ] Change `5` to desired limit

## 🚀 Production Deployment

### When You're Ready to Go Live:

1. **Get Live Stripe Keys**
   - [ ] Go to https://dashboard.stripe.com/apikeys (remove `/test`)
   - [ ] Copy your live "Secret key" (starts with `sk_live_`)

2. **Verify Your Domain in SendGrid** (Recommended)
   - [ ] Go to https://app.sendgrid.com/settings/sender_auth
   - [ ] Click "Verify a Domain"
   - [ ] Follow instructions to add DNS records
   - [ ] Use `noreply@yourdomain.com` as FROM_EMAIL

3. **Configure Netlify Environment Variables**
   - [ ] Go to your Netlify dashboard
   - [ ] Select your site
   - [ ] Go to: Site settings → Environment variables
   - [ ] Add these variables:
     - `STRIPE_SECRET_KEY` = your live key (sk_live_...)
     - `SENDGRID_API_KEY` = your production key
     - `FROM_EMAIL` = noreply@yourdomain.com
     - `URL` = https://yoursite.com

4. **Deploy**
   - [ ] Commit your changes: `git add . && git commit -m "Add magic link paywall"`
   - [ ] Push to Netlify: `git push origin master`
   - [ ] Wait for build to complete

5. **Test in Production**
   - [ ] Use a REAL credit card (small amount to test)
   - [ ] Complete a real purchase
   - [ ] Verify magic link email arrives
   - [ ] Test on different devices
   - [ ] Monitor Stripe dashboard for payments

## 🐛 Common Issues

### "No email received"
- [ ] Check spam/junk folder
- [ ] Verify FROM_EMAIL is verified in SendGrid
- [ ] Check SendGrid activity feed: https://app.sendgrid.com/email_activity
- [ ] Ensure you entered the correct email during purchase

### "No purchase found for this email"
- [ ] Wait 30 seconds after payment (Stripe needs to process)
- [ ] Check email matches exactly (case-sensitive)
- [ ] Verify payment in Stripe dashboard: https://dashboard.stripe.com/payments
- [ ] Ensure `courseId` matches in both article and Stripe metadata

### "Rate limit hit"
- [ ] Wait 1 hour (rate limits reset)
- [ ] Or adjust rate limit in code (see Customization section above)

### Functions not working
- [ ] Ensure Netlify CLI is running: `npx netlify dev` (not just `hugo server`)
- [ ] Check function logs in terminal for errors
- [ ] Verify all environment variables are set in `.env`

### Session not persisting
- [ ] Check if localStorage is enabled in browser
- [ ] Check browser console for errors (F12)
- [ ] Try clearing cache and cookies

## 📊 Monitoring

Once live, regularly check:

- [ ] **Stripe Dashboard**: https://dashboard.stripe.com/payments
  - View successful payments
  - Check for failed payments or disputes

- [ ] **SendGrid Activity**: https://app.sendgrid.com/email_activity
  - Monitor email delivery rate
  - Check for bounces or spam reports

- [ ] **Netlify Function Logs**
  - Go to your Netlify site → Functions
  - Check logs for errors

## 🎉 Success!

When you've completed the checklist:

- ✅ You have a working magic link paywall
- ✅ You can accept payments via Stripe
- ✅ Users get email verification
- ✅ Content unlocks securely
- ✅ Cross-device access works
- ✅ You have abuse protection

**You're ready to monetize your content!**

## 📚 Need Help?

- **Full Documentation**: `MAGIC_LINK_README.md`
- **Quick Reference**: `MAGIC_LINK_QUICKSTART.md`
- **Complete Guide**: `IMPLEMENTATION_COMPLETE.md`

**Stripe Dashboard**: https://dashboard.stripe.com
**SendGrid Dashboard**: https://app.sendgrid.com
**Netlify Dashboard**: https://app.netlify.com
