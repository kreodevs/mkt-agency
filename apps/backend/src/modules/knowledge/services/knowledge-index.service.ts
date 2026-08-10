import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashKnowledgeContent, splitTextIntoChunks } from '../domain/text-chunk.util';
import { TenantKnowledgeChunkEntity } from '../infrastructure/typeorm/tenant-knowledge-chunk.entity';
import { EmbeddingService } from './embedding.service';

export type KnowledgeSourceType = 'brand_brief' | 'approved_content' | 'media_kit';

@Injectable()
export class KnowledgeIndexService {
  private readonly logger = new Logger(KnowledgeIndexService.name);

  constructor(
    @InjectRepository(TenantKnowledgeChunkEntity)
    private readonly chunks: Repository<TenantKnowledgeChunkEntity>,
    private readonly embedding: EmbeddingService,
  ) {}

  async indexText(params: {
    tenantId: string;
    productId?: string | null;
    sourceType: KnowledgeSourceType;
    sourceId: string;
    text: string;
  }): Promise<void> {
    const parts = splitTextIntoChunks(params.text);
    if (parts.length === 0) {
      await this.chunks.delete({
        tenantId: params.tenantId,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
      });
      return;
    }

    await this.chunks.delete({
      tenantId: params.tenantId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });

    const savedIds: string[] = [];

    for (let index = 0; index < parts.length; index += 1) {
      const content = parts[index];
      const row = await this.chunks.save(
        this.chunks.create({
          tenantId: params.tenantId,
          productId: params.productId ?? null,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          chunkIndex: index,
          content,
          contentHash: hashKnowledgeContent(content),
          embedding: await this.embedding.embed(content),
        }),
      );
      savedIds.push(row.id);
    }

    if (savedIds.length > 0) {
      await this.chunks.query(
        `UPDATE tenant_knowledge_chunks
         SET search_vector = to_tsvector('spanish', content)
         WHERE id = ANY($1::uuid[])`,
        [savedIds],
      );
    }
  }

  async indexBrandBrief(
    tenantId: string,
    interviewId: string,
    markdown: string,
    productId?: string | null,
  ): Promise<void> {
    await this.indexText({
      tenantId,
      productId,
      sourceType: 'brand_brief',
      sourceId: interviewId,
      text: markdown,
    });
  }

  async indexApprovedContent(
    tenantId: string,
    contentId: string,
    title: string,
    body: string,
    productId?: string | null,
  ): Promise<void> {
    const text = [title.trim(), body.trim()].filter(Boolean).join('\n\n');
    await this.indexText({
      tenantId,
      productId,
      sourceType: 'approved_content',
      sourceId: contentId,
      text,
    });
  }

  async indexMediaKitItem(
    tenantId: string,
    productId: string,
    itemId: string,
    role: string,
    label?: string | null,
  ): Promise<void> {
    const text = [`Rol: ${role}`, label?.trim() ? `Etiqueta: ${label.trim()}` : '']
      .filter(Boolean)
      .join('\n');
    await this.indexText({
      tenantId,
      productId,
      sourceType: 'media_kit',
      sourceId: itemId,
      text,
    });
  }

  async reindexTenantProductMediaKit(
    tenantId: string,
    productId: string,
    items: Array<{ id: string; role: string; label: string | null }>,
  ): Promise<void> {
    for (const item of items) {
      try {
        await this.indexMediaKitItem(tenantId, productId, item.id, item.role, item.label);
      } catch (error) {
        this.logger.warn(`Media kit index failed for item ${item.id}`, error);
      }
    }
  }
}
