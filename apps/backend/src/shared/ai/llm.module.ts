import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmConfigService } from './llm-config.service';
import { LlmClient } from './llm.client';

@Module({
  imports: [TypeOrmModule.forFeature([LlmTaskConfigEntity])],
  providers: [LlmClient, LlmConfigService],
  exports: [LlmClient, LlmConfigService],
})
export class LlmModule {}
