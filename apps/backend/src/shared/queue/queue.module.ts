import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  QUEUE_AUDIT_RETENTION,
  QUEUE_CAMPAIGN_STRATEGY,
  QUEUE_PROPOSAL_GENERATION,
  QUEUE_REPORT_GENERATION,
  QUEUE_SECTION_SUGGESTION,
  QUEUE_SECURITY_ALERT,
  QUEUE_SSL_PROVISION,
  QUEUE_AGENCY_WEEKLY_RUN,
  QUEUE_APPROVAL_REMINDER,
  QUEUE_COPILOT_PREPARE_WEEK,
  QUEUE_COMPETITOR_DISCOVERY,
} from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_SECTION_SUGGESTION },
      { name: QUEUE_CAMPAIGN_STRATEGY },
      { name: QUEUE_SSL_PROVISION },
      { name: QUEUE_PROPOSAL_GENERATION },
      { name: QUEUE_REPORT_GENERATION },
      { name: QUEUE_AUDIT_RETENTION },
      { name: QUEUE_SECURITY_ALERT },
      { name: QUEUE_AGENCY_WEEKLY_RUN },
      { name: QUEUE_APPROVAL_REMINDER },
      { name: QUEUE_COPILOT_PREPARE_WEEK },
      { name: QUEUE_COMPETITOR_DISCOVERY },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
