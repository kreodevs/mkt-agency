import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  QUEUE_CAMPAIGN_STRATEGY,
  QUEUE_SECTION_SUGGESTION,
  QUEUE_SSL_PROVISION,
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
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
