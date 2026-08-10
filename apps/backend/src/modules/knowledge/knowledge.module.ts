import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmProviderEntity } from '../platform/infrastructure/typeorm/llm-provider.entity';
import { TenantKnowledgeChunkEntity } from './infrastructure/typeorm/tenant-knowledge-chunk.entity';
import { EmbeddingService } from './services/embedding.service';
import { KnowledgeIndexService } from './services/knowledge-index.service';
import { KnowledgeRetrievalService } from './services/knowledge-retrieval.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantKnowledgeChunkEntity, LlmProviderEntity])],
  providers: [EmbeddingService, KnowledgeIndexService, KnowledgeRetrievalService],
  exports: [KnowledgeIndexService, KnowledgeRetrievalService],
})
export class KnowledgeModule {}
