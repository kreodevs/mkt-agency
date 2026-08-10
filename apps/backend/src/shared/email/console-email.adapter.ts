import { Injectable, Logger } from '@nestjs/common';
import type { EmailMessage, EmailSenderPort } from './email.port';

/** Fallback when SMTP is not configured (dev / tests). */
@Injectable()
export class ConsoleEmailAdapter implements EmailSenderPort {
  private readonly logger = new Logger(ConsoleEmailAdapter.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `Email (console) to=${message.to.join(', ')} subject="${message.subject}"\n${message.text}`,
    );
  }
}
