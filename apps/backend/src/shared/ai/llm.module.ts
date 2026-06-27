import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmConfigService } from './llm-config.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmClient } from './llm.client';

@Module({
  imports: [TypeOrmModule.forFeature([LlmTaskConfigEntity, LlmProviderEntity])],
  providers: [LlmClient, LlmConfigService, LlmProviderService],
  exports: [LlmClient, LlmConfigService, LlmProviderService],
})
export class LlmModule {}
