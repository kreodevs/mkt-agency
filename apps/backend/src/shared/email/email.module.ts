import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsoleEmailAdapter } from './console-email.adapter';
import { EMAIL_SENDER, EmailSenderPort } from './email.port';
import { SmtpEmailAdapter } from './smtp-email.adapter';

function isSmtpConfigured(config: ConfigService): boolean {
  return Boolean(config.get<string>('SMTP_HOST', '').trim());
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleEmailAdapter,
    SmtpEmailAdapter,
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService, SmtpEmailAdapter, ConsoleEmailAdapter],
      useFactory: (
        config: ConfigService,
        smtp: SmtpEmailAdapter,
        console: ConsoleEmailAdapter,
      ): EmailSenderPort => (isSmtpConfigured(config) ? smtp : console),
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
