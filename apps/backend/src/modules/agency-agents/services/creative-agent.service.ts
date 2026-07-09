import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { AgentRole } from '../domain/agent-role.enum';
import type { CreativePackPayload } from '../domain/handoff/creative-pack.types';
import type { ContentBriefPayload } from '../domain/handoff/creative-pack.types';
import { AgentEventService } from './agent-event.service';

@Injectable()
export class CreativeAgentService {
  private readonly logger = new Logger(CreativeAgentService.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly agentEvents: AgentEventService,
  ) {}

  async generateFromBrief(
    tenantId: string,
    planId: string,
    brief: ContentBriefPayload,
    productId?: string | null,
  ): Promise<CreativePackPayload> {
    const pack = await this.buildCreativePack(tenantId, brief);

    await this.agentEvents.logIfAgentActive(AgentRole.CREATIVE, {
      tenantId,
      productId: productId ?? null,
      sourceAgent: AgentRole.CREATIVE,
      targetAgent: AgentRole.MEDIA_BUYER,
      eventType: 'CreativePackReady',
      payload: { planId, pack },
      correlationId: planId,
    });

    return pack;
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
