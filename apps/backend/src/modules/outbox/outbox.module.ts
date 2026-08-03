import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { QueueModule } from '../../shared/queue/queue.module';
import { SecurityModule } from '../security/security.module';
import { CompanyProfileCompletedOutboxHandler } from './handlers/company-profile-completed-outbox.handler';
import { ContentApprovedOutboxHandler } from './handlers/content-approved-outbox.handler';
import { ProposalSignedOutboxHandler } from './handlers/proposal-signed-outbox.handler';
import { SecurityAlertOutboxHandler } from './handlers/security-alert-outbox.handler';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxHandlerRegistry } from './outbox-handler.registry';
import { OutboxDispatcherProcessor } from './workers/outbox-dispatcher.processor';
import { OutboxDispatcherWorkerService } from './workers/outbox-dispatcher.worker';

@Module({
  imports: [
    ConfigModule,
    QueueModule,
    SecurityModule,
    TypeOrmModule.forFeature([OutboxEntity]),
  ],
  providers: [
    SecurityAlertOutboxHandler,
    ProposalSignedOutboxHandler,
    CompanyProfileCompletedOutboxHandler,
    ContentApprovedOutboxHandler,
    OutboxHandlerRegistry,
    OutboxDispatcherService,
    OutboxDispatcherWorkerService,
    OutboxDispatcherProcessor,
  ],
  exports: [OutboxDispatcherService],
})
export class OutboxModule {}
