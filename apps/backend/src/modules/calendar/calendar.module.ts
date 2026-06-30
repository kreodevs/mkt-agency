import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ContentEntity } from '../content/infrastructure/typeorm/content.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AuthSharedModule, TypeOrmModule.forFeature([ContentEntity, CampaignEntity, ProductEntity])],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
