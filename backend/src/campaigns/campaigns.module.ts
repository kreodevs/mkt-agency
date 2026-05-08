import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { Keyword } from './entities/keyword.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Keyword])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}