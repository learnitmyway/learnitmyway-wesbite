## Resend email setup

This project uses **Resend** as the email provider for sending magic-link emails in the premium content flow.

## Environment variables

- `RESEND_API_KEY`
  - Get this from the Resend dashboard.
- `EMAIL_FROM`
  - The sender address for magic-link emails (e.g. `Your Name <you@example.com>`).
  - Must be allowed/verified in Resend; otherwise Resend will reject sends.
