import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { LoggingSecurityAlertAdapter } from './adapters/logging-security-alert.adapter';
import {
  SECURITY_ALERT_NOTIFIER,
  SecurityAlertNotifierPort,
} from './adapters/security-alert-notifier.port';
import { SlackSecurityAlertAdapter } from './adapters/slack-security-alert.adapter';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { SecurityEventEntity } from './infrastructure/typeorm/security-event.entity';
import { SecurityAlertObserver } from './observers/security-alert.observer';
import { SecurityController } from './security.controller';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventRecorderService } from './services/security-event-recorder.service';

@Module({
  imports: [
    ConfigModule,
    AuthSharedModule,
    TypeOrmModule.forFeature([SecurityEventEntity, TenantEntity, OutboxEntity]),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityEventRecorderService,
    SecurityEventsService,
    SecurityAlertObserver,
    SlackSecurityAlertAdapter,
    LoggingSecurityAlertAdapter,
    {
      provide: SECURITY_ALERT_NOTIFIER,
      inject: [ConfigService, SlackSecurityAlertAdapter, LoggingSecurityAlertAdapter],
      useFactory: (
        config: ConfigService,
        slack: SlackSecurityAlertAdapter,
        logging: LoggingSecurityAlertAdapter,
      ): SecurityAlertNotifierPort =>
        config.get<string>('SLACK_SECURITY_WEBHOOK_URL') ? slack : logging,
    },
  ],
  exports: [SecurityEventRecorderService, SECURITY_ALERT_NOTIFIER],
})
export class SecurityModule {}
