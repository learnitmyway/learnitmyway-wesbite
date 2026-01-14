/**
 * SendGrid Email Provider Implementation
 */
import type { EmailProvider, EmailOptions } from '../email-provider';

export class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = 'noreply@learnitmyway.com') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: { email: this.fromEmail },
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text,
          }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
    }
  }
}

/**
 * Factory function to create email provider instance
 */
export function createEmailProvider(providerName: string, apiKey: string, fromEmail?: string): EmailProvider {
  if (providerName === 'sendgrid') {
    return new SendGridProvider(apiKey, fromEmail);
  }
  
  throw new Error(`Unsupported email provider: ${providerName}`);
}

