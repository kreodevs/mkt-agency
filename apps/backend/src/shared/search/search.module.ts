import { Module } from '@nestjs/common';
import { PlatformModule } from '../../modules/platform/platform.module';
import { TavilySearchService } from './tavily.client';

@Module({
  imports: [PlatformModule],
  providers: [TavilySearchService],
  exports: [TavilySearchService],
})
export class SearchModule {}
