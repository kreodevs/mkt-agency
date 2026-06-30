import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  CompetitorDiscoveryAdapterPort,
  CompetitorDiscoveryContext,
  DiscoveredCompetitorResult,
} from './competitor-discovery.adapter.port';

interface DiscoveryJsonResponse {
  competitors?: Array<{
    name?: string;
    website?: string | null;
    industry?: string | null;
    rationale?: string | null;
  }>;
}

@Injectable()
export class OpenRouterCompetitorDiscoveryAdapter implements CompetitorDiscoveryAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async discover(context: CompetitorDiscoveryContext): Promise<DiscoveredCompetitorResult[]> {
    const scopeLabel =
      context.scope === 'global'
        ? 'mercado global'
        : context.scope === 'country'
          ? `país: ${context.country}`
          : `ciudad: ${context.city}, ${context.country}`;

    const systemPrompt =
      'Eres un analista de mercado. Identifica competidores reales y relevantes para la empresa descrita. ' +
      'Responde SOLO con JSON válido en español, sin markdown.';

    const userPrompt = JSON.stringify({
      task: `Sugiere entre 5 y 8 competidores para el alcance: ${scopeLabel}.`,
      companyContext: {
        companyName: context.companyName,
        industry: context.industry,
        targetAudience: context.targetAudience,
        website: context.website,
      },
      rules: [
        'Incluye solo empresas plausibles en el sector indicado.',
        'Prioriza competidores activos en el alcance geográfico solicitado.',
        'website puede ser dominio sin https.',
      ],
      outputFormat: {
        competitors: [
          {
            name: 'Nombre comercial',
            website: 'dominio.com o null',
            industry: 'sector o null',
            rationale: 'Por qué compite con esta empresa (1 frase)',
          },
        ],
      },
    });

    const parsed = await this.llm.chatJson<DiscoveryJsonResponse>(systemPrompt, userPrompt, {
      taskType: 'competitor_discovery',
      temperature: 0.6,
    });

    return (parsed.competitors ?? [])
      .filter((item) => item.name?.trim())
      .map((item) => ({
        name: item.name!.trim(),
        website: item.website?.trim() || null,
        industry: item.industry?.trim() || null,
        rationale: item.rationale?.trim() || null,
      }));
  }
}
