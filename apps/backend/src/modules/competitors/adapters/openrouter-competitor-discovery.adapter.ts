import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { isRetailBusiness } from '../domain/competitor-discovery-context.util';
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

    const retail = isRetailBusiness(context);

    const systemPrompt =
      'Eres un analista de inteligencia competitiva B2B. ' +
      'Identifica empresas que compiten DIRECTAMENTE con la empresa descrita, vendiendo productos o servicios del MISMO tipo. ' +
      'No confundas alcance geográfico con sector: un país no implica supermercados ni retail masivo salvo que la empresa sea retail. ' +
      'Responde SOLO con JSON válido en español, sin markdown.';

    const userPrompt = JSON.stringify({
      task: `Sugiere entre 5 y 8 competidores reales para el alcance: ${scopeLabel}.`,
      companyProfile: {
        companyName: context.companyName,
        industryCode: context.industry,
        industryLabel: context.industryLabel,
        website: context.website,
        targetAudience: context.targetAudience,
        brandVoice: context.brandVoice,
        objectives: context.objectives ?? [],
        productOrServiceSummary: context.productSummary,
        brandBriefExcerpt: context.brandBriefExcerpt,
      },
      strictRules: [
        'Competidor = alternativa real que un cliente consideraría en lugar de esta empresa.',
        'Misma categoría de producto/servicio y audiencia similar.',
        retail
          ? 'La empresa ES de retail/ecommerce de consumo: puedes incluir retailers del sector.'
          : 'PROHIBIDO sugerir supermercados, tiendas departamentales, marketplaces genéricos (Walmart, Liverpool, Mercado Libre, Amazon, Chedraui, etc.) salvo que la empresa vende lo mismo.',
        'Prioriza competidores activos en el alcance geográfico sin cambiar de sector.',
        'No repitas empresas en existingCompetitorNames.',
        'website: dominio sin https o null si no se conoce.',
        'rationale: explica el solapamiento de producto/servicio en una frase.',
      ],
      existingCompetitorNames: context.existingCompetitorNames ?? [],
      outputFormat: {
        competitors: [
          {
            name: 'Nombre comercial',
            website: 'dominio.com o null',
            industry: 'sector del competidor',
            rationale: 'Por qué compite en el mismo rubro (1 frase)',
          },
        ],
      },
    });

    const parsed = await this.llm.chatJson<DiscoveryJsonResponse>(systemPrompt, userPrompt, {
      taskType: 'competitor_discovery',
      temperature: 0.35,
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
