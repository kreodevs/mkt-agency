import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmConfigService } from './llm-config.service';
import { LlmModelsCatalogService } from './llm-models-catalog.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmClient } from './llm.client';

@Module({
  imports: [TypeOrmModule.forFeature([LlmTaskConfigEntity, LlmProviderEntity])],
  providers: [LlmClient, LlmConfigService, LlmProviderService, LlmModelsCatalogService],
  exports: [LlmClient, LlmConfigService, LlmProviderService, LlmModelsCatalogService],
})
export class LlmModule {}
