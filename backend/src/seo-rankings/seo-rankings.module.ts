import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoRankingsController } from './seo-rankings.controller';
import { SeoRankingsService } from './seo-rankings.service';
import { SeoRanking } from './entities/seo-ranking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeoRanking])],
  controllers: [SeoRankingsController],
  providers: [SeoRankingsService],
  exports: [SeoRankingsService],
})
export class SeoRankingsModule {}
