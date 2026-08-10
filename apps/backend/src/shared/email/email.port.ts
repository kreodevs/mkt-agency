export interface EmailMessage {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailSenderPort {
  send(message: EmailMessage): Promise<void>;
}
