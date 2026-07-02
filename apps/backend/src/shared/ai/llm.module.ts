import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmUsageEventEntity } from '../../modules/platform/infrastructure/typeorm/llm-usage-event.entity';
import { LlmConfigService } from './llm-config.service';
import { LlmModelsCatalogService } from './llm-models-catalog.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmUsageService } from './llm-usage.service';
import { LlmClient } from './llm.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([LlmTaskConfigEntity, LlmProviderEntity, LlmUsageEventEntity]),
  ],
  providers: [LlmClient, LlmConfigService, LlmProviderService, LlmModelsCatalogService, LlmUsageService],
  exports: [LlmClient, LlmConfigService, LlmProviderService, LlmModelsCatalogService, LlmUsageService],
})
export class LlmModule {}
