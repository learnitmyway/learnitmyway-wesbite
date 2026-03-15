# Magic link authentication (premium content)

Summary of the magic link–based authentication system for premium content, for picking up with new features later.

## Overview

- **Purpose:** Let users who have paid for premium content access it without traditional login (no passwords, no accounts).
- **Abstracted providers:** Payment and email are behind swappable abstractions (e.g. Stripe, Resend); easy to swap for other providers.
- **Storage:** Netlify Blobs store access tokens and payment records.
- **Verification:** Webhooks verify payments; tokens are created and magic links sent after successful payment.
- **Renewal:** Expired tokens are automatically renewed when a payment record exists for that email + article (same token UUID, new 30-day expiry).

## Data stores (Netlify Blobs)

- **Tokens store** (`tokens`)
  - Key: `token:{articleSlug}:{uuid}`
  - Value: `TokenRecord` (email, createdAtUtc, expiresAtUtc, articleSlug).
- **Payments store** (`payments`)
  - Key: `payment:{normalizedEmail}:{articleSlug}`
  - Value: `PaymentRecord` (email, articleSlug, paidAtUTC, paymentId).

## Flows

1. **Checkout → webhook → token + email**
   - User pays via checkout (e.g. Stripe Checkout).
   - `payment-webhook` receives `checkout.session.completed`, stores payment record and a new token, sends magic link email.

2. **Magic link → access**
   - User clicks magic link (e.g. `/.netlify/functions/access?article=...&token=...`).
   - `access` calls `validateToken`. If valid (or expired but payment exists and renewal succeeds), sets cookie and redirects to article.

3. **Page load with cookie → verify**
   - `premium-access.js` reads cookie by article slug, calls `verify-token` with articleSlug + token.
   - `verify-token` uses same `validateToken` (including renewal when expired + payment exists). Frontend shows or hides premium content based on response.

## Auto-renewal (expired tokens)

If a token is expired but a payment record exists for that email + article:

- `validateToken` (in `_shared/validate-token.mts`) looks up the payment via `getPaymentRecord`.
- If found, it calls `renewToken` (same UUID, new 30-day expiry), re-fetches the token, and returns success.
- No new magic link or frontend change is required; both magic-link and cookie+verify flows benefit.

## Key files

- `netlify/functions/access.mts` – magic link handler; sets cookie and redirects.
- `netlify/functions/verify-token.mts` – token verification for page load (cookie path).
- `netlify/functions/payment-webhook.mts` – payment completion; stores payment + token, sends magic link email.
- `netlify/functions/create-checkout-session.mts` – creates checkout session with article metadata.
- `netlify/functions/_shared/validate-token.mts` – validates token and performs renewal when expired + payment exists.
- `netlify/functions/_shared/token-storage.mts` – token CRUD and `renewToken`.
- `netlify/functions/_shared/payment-storage.mts` – payment record store and `getPaymentRecord`.
- `netlify/functions/_shared/email.mts` – send magic link email (abstracted).
- `netlify/functions/_shared/payment.mts` – payment provider API key (abstracted).
- `netlify/functions/_shared/magic-link.mts` – build magic link URL.
- `static/js/premium-access.js` – reads cookie, calls verify-token, shows/hides premium content.

## Possible next features

- Resend magic link (endpoint that looks up email by article/token and sends a new link).
- Configurable token expiry or max renewals.
- Different payment or email provider via existing abstractions.
