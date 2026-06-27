import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import type { LeadScoringContext, ScoringAdapterPort } from './scoring.adapter.port';

@Injectable()
export class OpenRouterScoringAdapter implements ScoringAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async score(context: LeadScoringContext): Promise<number> {
    const systemPrompt =
      'Eres un analista CRM B2B. Responde SOLO JSON: {"score": number} con score entero 0-100 ' +
      'según probabilidad de conversión del lead.';

    const userPrompt = JSON.stringify({
      lead: {
        email: context.lead.email,
        name: context.lead.name,
        phone: context.lead.phone,
        company: context.lead.company,
        stage: context.lead.stage,
      },
      interactionCount: context.interactions.length,
      recentInteractionTypes: context.interactions.slice(0, 5).map((i) => i.type),
    });

    const result = await this.llm.chatJson<{ score?: number }>(
      systemPrompt,
      userPrompt,
      { taskType: 'lead_scoring' },
    );
    const raw = result?.score ?? 0;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }
}
