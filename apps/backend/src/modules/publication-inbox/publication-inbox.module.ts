import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { UserEntity } from '../../shared/infrastructure/typeorm/user.entity';
import { CommunityManagerModule } from '../community-manager/community-manager.module';
import { ContentModule } from '../content/content.module';
import { StrategyModule } from '../strategy/strategy.module';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { AgencyNotificationEntity } from './infrastructure/typeorm/agency-notification.entity';
import { PublicationInboxController } from './publication-inbox.controller';
import { PublicationInboxService } from './publication-inbox.service';
import { AgencyOrchestrationService } from './agency-orchestration.service';
import { AgencyWeeklyRunProcessor } from './workers/agency-weekly-run.processor';
import { AgencyWeeklyRunWorkerService } from './workers/agency-weekly-run.worker';
import { ApprovalReminderProcessor } from './workers/approval-reminder.processor';
import { ApprovalReminderWorkerService } from './workers/approval-reminder.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    ContentModule,
    CommunityManagerModule,
    StrategyModule,
    TypeOrmModule.forFeature([
      ContentEntity,
      AgencyNotificationEntity,
      TenantEntity,
      ProductEntity,
      UserEntity,
    ]),
  ],
  controllers: [PublicationInboxController],
  providers: [
    PublicationInboxService,
    AgencyOrchestrationService,
    AgencyWeeklyRunWorkerService,
    AgencyWeeklyRunProcessor,
    ApprovalReminderWorkerService,
    ApprovalReminderProcessor,
  ],
  exports: [PublicationInboxService],
})
export class PublicationInboxModule {}
