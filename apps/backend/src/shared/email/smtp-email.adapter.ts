import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailMessage, EmailSenderPort } from './email.port';

@Injectable()
export class SmtpEmailAdapter implements EmailSenderPort {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const transport = this.getTransporter();
    const from = this.config.get<string>('SMTP_FROM', 'noreply@mkt-agency.local');

    await transport.sendMail({
      from,
      to: message.to.join(', '),
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    this.logger.debug(`Email sent to ${message.to.join(', ')}: ${message.subject}`);
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.config.get<string>('SMTP_HOST', '').trim();
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER', '').trim();
    const pass = this.config.get<string>('SMTP_PASS', '').trim();
    const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';

    if (!host) {
      throw new Error('SMTP_HOST is required for SmtpEmailAdapter');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    return this.transporter;
  }
}
