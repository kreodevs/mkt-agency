import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorsController } from './competitors.controller';
import { CompetitorsService } from './competitors.service';
import { Competitor } from './entities/competitor.entity';
import { CompetitorMention } from './entities/competitor-mention.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Competitor, CompetitorMention])],
  controllers: [CompetitorsController],
  providers: [CompetitorsService],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
