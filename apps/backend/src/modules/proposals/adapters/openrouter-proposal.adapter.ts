import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  GeneratedProposalContent,
  ProposalAdapterPort,
  ProposalGenerationContext,
} from './proposal.adapter.port';

@Injectable()
export class OpenRouterProposalAdapter implements ProposalAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generate(context: ProposalGenerationContext): Promise<GeneratedProposalContent> {
    const systemPrompt =
      'Eres un consultor comercial de marketing digital. Responde SOLO con JSON válido: ' +
      '{"summary":"...","objectives":["..."],"strategy":"...","budget":{"total":number,"breakdown":[{"item":"...","amount":number}]},"timeline":[{"phase":"...","duration":"..."}],"deliverables":["..."]}. ' +
      'Usa español neutro. Montos en EUR.';

    const userPrompt = JSON.stringify({
      task: 'Generar propuesta comercial completa',
      title: context.title,
      campaign: context.campaign,
      companyProfile: context.companyProfile,
    });

    const result = await this.llm.chatJson<GeneratedProposalContent>(
      systemPrompt,
      userPrompt,
    );

    if (
      !result?.summary ||
      !Array.isArray(result.objectives) ||
      !result.budget?.total
    ) {
      throw new Error('Invalid proposal response from LLM');
    }

    return result;
  }
}
