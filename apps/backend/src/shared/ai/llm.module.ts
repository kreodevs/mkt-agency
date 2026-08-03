import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmUsageEventEntity } from '../../modules/platform/infrastructure/typeorm/llm-usage-event.entity';
import { LlmCircuitBreakerService } from './llm-circuit-breaker.service';
import { LlmConfigService } from './llm-config.service';
import { LlmModelsCatalogService } from './llm-models-catalog.service';
import { LlmProviderBootstrapService } from './llm-provider-bootstrap.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmUsageService } from './llm-usage.service';
import { LlmClient } from './llm.client';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([LlmTaskConfigEntity, LlmProviderEntity, LlmUsageEventEntity]),
  ],
  providers: [
    LlmClient,
    LlmConfigService,
    LlmProviderService,
    LlmProviderBootstrapService,
    LlmCircuitBreakerService,
    LlmModelsCatalogService,
    LlmUsageService,
  ],
  exports: [LlmClient, LlmConfigService, LlmProviderService, LlmModelsCatalogService, LlmUsageService],
})
export class LlmModule {}
