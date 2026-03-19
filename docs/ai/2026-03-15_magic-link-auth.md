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

4. **Resend magic link (email + articleSlug)**
   - User visits the premium article page and sees a small form or UI for “Didn’t get the email?”.
   - They provide their email (article slug comes from the page itself or is submitted explicitly).
   - Frontend sends a `POST` request to `/.netlify/functions/resend-magic-link` with `{ email, articleSlug }` in the JSON body.
   - The function:
     - Looks up a `PaymentRecord` for `(email, articleSlug)` via `getPaymentRecord`.
     - If **no payment record exists** or something goes wrong, returns a generic failure (`{ success: false, error: '...' }`) so we don’t reveal purchase status.
     - If a payment record exists, creates a **new token UUID** (30-day expiry, same as initial flow), stores it via `storeToken`, generates a magic link with `generateMagicLink`, and sends it via `sendMagicLinkEmail`.
   - Response shape:
     - Success: HTTP 200 with `{ success: true }`.
     - Generic failure (no payment / privacy-preserving): HTTP 200 with `{ success: false, error: string }`.
     - Validation or server errors: HTTP 4xx/5xx with `{ success: false, error: string }`.

## Auto-renewal (expired tokens)

If a token is expired but a payment record exists for that email + article:

- `validateToken` (in `_shared/validate-token.mts`) looks up the payment via `getPaymentRecord`.
- If found, it calls `renewToken` (same UUID, new 30-day expiry), re-fetches the token, and returns success.
- No new magic link or frontend change is required; both magic-link and cookie+verify flows benefit.

## Key files

- `netlify/functions/access.mts` – magic link handler; sets cookie and redirects.
- `netlify/functions/verify-token.mts` – token verification for page load (cookie path).
- `netlify/functions/payment-webhook.mts` – payment completion; stores payment + token, sends magic link email.
- `netlify/functions/resend-magic-link.mts` – resend endpoint; checks for existing payment and sends a fresh magic link when allowed.
- `netlify/functions/create-checkout-session.mts` – creates checkout session with article metadata.
- `netlify/functions/_shared/validate-token.mts` – validates token and performs renewal when expired + payment exists.
- `netlify/functions/_shared/token-storage.mts` – token CRUD and `renewToken`.
- `netlify/functions/_shared/payment-storage.mts` – payment record store and `getPaymentRecord`.
- `netlify/functions/_shared/email.mts` – send magic link email (abstracted).
- `netlify/functions/_shared/payment.mts` – payment provider API key (abstracted).
- `netlify/functions/_shared/magic-link.mts` – build magic link URL.
- `static/js/premium-access.js` – reads cookie, calls verify-token, shows/hides premium content.

## Possible next features

- Configurable token expiry or max renewals.
- Different payment or email provider via existing abstractions.
