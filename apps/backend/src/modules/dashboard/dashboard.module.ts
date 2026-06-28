import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { LeadEntity } from '../crm/infrastructure/typeorm/lead.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadEntity, ContentEntity, CampaignEntity])],
  controllers: [DashboardController],
})
export class DashboardModule {}