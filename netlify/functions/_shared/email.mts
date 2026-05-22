import { Resend } from 'resend';

export interface SendMagicLinkEmailOptions {
  to: string;
  magicLink: string;
  articleSlug?: string;
}

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  return apiKey;
}

function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set in environment variables');
  }
  return from;
}

export async function sendMagicLinkEmail(
  options: SendMagicLinkEmailOptions
): Promise<void> {
  const { to, magicLink, articleSlug } = options;
  const resend = new Resend(getResendApiKey());
  const from = getEmailFrom();

  const subject = articleSlug
    ? `Your access link for ${articleSlug}`
    : 'Your access link';

  const html = articleSlug
    ? `<p>Thanks for your purchase. Use the link below to access your premium content:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link is valid for 30 days.</p>`
    : `<p>Thanks for your purchase. Use the link below to access your premium content:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link is valid for 30 days.</p>`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed to send email: ${JSON.stringify(error)}`);
  }
}
