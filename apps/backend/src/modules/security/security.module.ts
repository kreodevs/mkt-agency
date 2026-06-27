import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { LoggingSecurityAlertAdapter } from './adapters/logging-security-alert.adapter';
import {
  SECURITY_ALERT_NOTIFIER,
  SecurityAlertNotifierPort,
} from './adapters/security-alert-notifier.port';
import { SlackSecurityAlertAdapter } from './adapters/slack-security-alert.adapter';
import { SecurityEventEntity } from './infrastructure/typeorm/security-event.entity';
import { SecurityAlertObserver } from './observers/security-alert.observer';
import { SecurityController } from './security.controller';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventRecorderService } from './services/security-event-recorder.service';
import { AlertProcessor } from './workers/alert.processor';
import { AlertWorkerService } from './workers/alert.worker';

@Module({
  imports: [
    ConfigModule,
    AuthSharedModule,
    QueueModule,
    TypeOrmModule.forFeature([SecurityEventEntity, OutboxEntity]),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityEventRecorderService,
    SecurityEventsService,
    SecurityAlertObserver,
    SlackSecurityAlertAdapter,
    LoggingSecurityAlertAdapter,
    AlertWorkerService,
    AlertProcessor,
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
  exports: [SecurityEventRecorderService],
})
export class SecurityModule {}
