/**
 * Email Provider Interface
 * Abstract interface for email providers to allow easy swapping
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  /**
   * Send an email
   */
  sendEmail(options: EmailOptions): Promise<void>;
}

