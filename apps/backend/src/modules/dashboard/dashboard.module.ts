import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { StrategyAdjustmentEntity } from '../strategy/infrastructure/typeorm/strategy-adjustment.entity';
import { CommunityManagerBatchEntity } from '../community-manager/infrastructure/typeorm/community-manager-batch.entity';
import { ContentVersionEntity } from '../content/infrastructure/typeorm/content-version.entity';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadEntity, ContentEntity, CampaignEntity, StrategyAdjustmentEntity, CommunityManagerBatchEntity, ContentVersionEntity])],
  controllers: [DashboardController],
})
export class DashboardModule {}