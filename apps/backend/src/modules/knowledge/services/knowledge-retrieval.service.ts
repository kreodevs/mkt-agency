import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cosineSimilarity } from '../domain/cosine-similarity.util';
import { sanitizeSearchQuery } from '../domain/text-chunk.util';
import { TenantKnowledgeChunkEntity } from '../infrastructure/typeorm/tenant-knowledge-chunk.entity';
import { EmbeddingService } from './embedding.service';

export interface RetrievedKnowledgeChunk {
  content: string;
  sourceType: string;
  score: number;
}

@Injectable()
export class KnowledgeRetrievalService {
  constructor(
    @InjectRepository(TenantKnowledgeChunkEntity)
    private readonly chunks: Repository<TenantKnowledgeChunkEntity>,
    private readonly embedding: EmbeddingService,
  ) {}

  async retrieve(
    tenantId: string,
    query: string,
    productId?: string,
    limit = 5,
  ): Promise<RetrievedKnowledgeChunk[]> {
    const normalizedQuery = sanitizeSearchQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    const vectorResults = await this.retrieveByEmbedding(
      tenantId,
      normalizedQuery,
      productId,
      limit,
    );
    if (vectorResults.length > 0) {
      return vectorResults;
    }

    return this.retrieveByFullText(tenantId, normalizedQuery, productId, limit);
  }

  async formatForPrompt(
    tenantId: string,
    query: string,
    productId?: string,
    limit = 5,
  ): Promise<string | null> {
    const chunks = await this.retrieve(tenantId, query, productId, limit);
    if (chunks.length === 0) {
      return null;
    }

    const lines = chunks.map((chunk, index) => {
      const label =
        chunk.sourceType === 'brand_brief'
          ? 'marca'
          : chunk.sourceType === 'approved_content'
            ? 'contenido aprobado'
            : 'media kit';
      return `${index + 1}. [${label}] ${chunk.content}`;
    });

    return [
      'Memoria de marca (referencia — adapta tono y mensajes, no copies literalmente):',
      ...lines,
    ].join('\n');
  }

  private async retrieveByEmbedding(
    tenantId: string,
    query: string,
    productId: string | undefined,
    limit: number,
  ): Promise<RetrievedKnowledgeChunk[]> {
    const queryEmbedding = await this.embedding.embed(query);
    if (!queryEmbedding) {
      return [];
    }

    const qb = this.chunks
      .createQueryBuilder('chunk')
      .where('chunk.tenant_id = :tenantId', { tenantId })
      .andWhere('chunk.embedding IS NOT NULL');

    if (productId) {
      qb.andWhere('(chunk.product_id IS NULL OR chunk.product_id = :productId)', { productId });
    }

    const rows = await qb.orderBy('chunk.updated_at', 'DESC').take(120).getMany();
    const ranked = rows
      .map((row) => ({
        content: row.content,
        sourceType: row.sourceType,
        score: cosineSimilarity(queryEmbedding, row.embedding ?? []),
      }))
      .filter((row) => row.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked;
  }

  private async retrieveByFullText(
    tenantId: string,
    query: string,
    productId: string | undefined,
    limit: number,
  ): Promise<RetrievedKnowledgeChunk[]> {
    const rows = (await this.chunks.query(
      `SELECT content, source_type, ts_rank(search_vector, plainto_tsquery('spanish', $3)) AS score
       FROM tenant_knowledge_chunks
       WHERE tenant_id = $1
         AND ($2::uuid IS NULL OR product_id IS NULL OR product_id = $2)
         AND search_vector @@ plainto_tsquery('spanish', $3)
       ORDER BY score DESC
       LIMIT $4`,
      [tenantId, productId ?? null, query, limit],
    )) as Array<{ content: string; source_type: string; score: string | number }>;

    return rows.map((row) => ({
      content: row.content,
      sourceType: row.source_type,
      score: Number(row.score) || 0,
    }));
  }
}
