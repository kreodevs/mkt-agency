import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmClient } from '../../../shared/ai/llm.client';
import { MediaBuyerStubService } from '../../paid-media/services/media-buyer-stub.service';
import { AgentRole } from '../domain/agent-role.enum';
import type { CreativePackPayload } from '../domain/handoff/creative-pack.types';
import type { ContentBriefPayload } from '../domain/handoff/creative-pack.types';
import { CreativePackEntity } from '../infrastructure/typeorm/creative-pack.entity';
import { AgentEventService } from './agent-event.service';

@Injectable()
export class CreativeAgentService {
  private readonly logger = new Logger(CreativeAgentService.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly agentEvents: AgentEventService,
    @InjectRepository(CreativePackEntity)
    private readonly packs: Repository<CreativePackEntity>,
    @Inject(forwardRef(() => MediaBuyerStubService))
    private readonly mediaBuyer: MediaBuyerStubService,
  ) {}

  async generateFromBrief(
    tenantId: string,
    planId: string,
    brief: ContentBriefPayload,
    productId?: string | null,
  ): Promise<CreativePackPayload> {
    const packPayload = await this.buildCreativePack(tenantId, brief);

    const saved = await this.packs.save(
      this.packs.create({
        tenantId,
        planId,
        productId: productId ?? null,
        payload: packPayload as unknown as Record<string, unknown>,
        status: 'ready',
      }),
    );

    await this.agentEvents.logIfAgentActive(AgentRole.CREATIVE, {
      tenantId,
      productId: productId ?? null,
      sourceAgent: AgentRole.CREATIVE,
      targetAgent: AgentRole.MEDIA_BUYER,
      eventType: 'CreativePackReady',
      payload: { planId, packId: saved.id, pack: packPayload },
      correlationId: planId,
    });

    void this.mediaBuyer.processCreativePack(tenantId, saved.id).catch((error) => {
      this.logger.warn(`Media buyer stub skipped/failed for pack ${saved.id}`, error);
    });

    return packPayload;
  }

  async listPacks(tenantId: string, limit = 20) {
    const rows = await this.packs.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      planId: row.planId,
      productId: row.productId,
      status: row.status,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async buildCreativePack(
    tenantId: string,
    brief: ContentBriefPayload,
  ): Promise<CreativePackPayload> {
    const platforms = brief.platforms.length > 0 ? brief.platforms : ['instagram'];

    try {
      const result = await this.llm.chatJson<CreativePackPayload>(
        'Eres Director Creativo. Responde JSON: {"hypotheses":[{"id","painPoint","angle","expectedLift"}],"adCopies":[{"hypothesisId","platform","format","headline","primaryText","cta","visualDirection"}]}. Mínimo 2 hipótesis y 1 copy por plataforma.',
        JSON.stringify({ brief, platforms }),
        { taskType: 'social_copy', tenantId },
      );
      if (Array.isArray(result?.hypotheses) && Array.isArray(result?.adCopies)) {
        return result;
      }
    } catch (error) {
      this.logger.warn('Creative pack LLM fallback', error);
    }

    return this.fallbackPack(brief, platforms);
  }

  private fallbackPack(brief: ContentBriefPayload, platforms: string[]): CreativePackPayload {
    const hypothesisId = 'h1';
    const pain = brief.topics[0] ?? brief.objective ?? 'necesidad del cliente';
    return {
      hypotheses: [
        {
          id: hypothesisId,
          painPoint: pain,
          angle: `Resolver ${pain} con propuesta clara de valor`,
          expectedLift: 'engagement + leads',
        },
      ],
      adCopies: platforms.map((platform) => ({
        hypothesisId,
        platform,
        format: 'static' as const,
        headline: `¿Buscas ${pain}?`,
        primaryText: `Te ayudamos con ${pain}. Escríbenos para más info.`,
        cta: 'Más información',
        visualDirection: 'Imagen limpia con producto y CTA visible',
      })),
    };
  }
}
