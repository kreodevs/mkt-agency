import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { CompetitorController } from './competitor.controller';
import { CompetitorService } from './competitor.service';
import { CompetitorMentionEntity } from './infrastructure/typeorm/competitor-mention.entity';
import { CompetitorEntity } from './infrastructure/typeorm/competitor.entity';

@Module({
  imports: [
    AuthSharedModule,
    TypeOrmModule.forFeature([CompetitorEntity, CompetitorMentionEntity]),
  ],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorsModule {}
