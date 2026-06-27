import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { CompetitorIntelAdapterPort } from './competitor-intel.adapter.port';

@Injectable()
export class OpenRouterCompetitorIntelAdapter implements CompetitorIntelAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generateAnalysis(
    competitors: string,
    tenantContext: {
      companyName?: string | null;
      industry?: string | null;
      targetAudience?: string | null;
    },
  ): Promise<Record<string, unknown>> {
    const systemPrompt =
      'Eres un analista de mercado senior especializado en inteligencia competitiva. ' +
      'Analiza los competidores proporcionados y genera un reporte estratégico en español. ' +
      'Responde SOLO con un objeto JSON válido, sin markdown.';

    const userPrompt = JSON.stringify({
      task: 'Realizar un análisis competitivo profundo de los siguientes competidores.',
      companyContext: tenantContext,
      competitors: competitors,
      outputFormat: {
        competitorLandscape: 'Análisis general del panorama competitivo (2-3 párrafos)',
        competitors: [
          {
            name: 'Nombre del competidor',
            overview: 'Descripción general',
            strengths: ['Fortaleza 1', 'Fortaleza 2'],
            weaknesses: ['Debilidad 1', 'Debilidad 2'],
            marketPosition: 'Posicionamiento en el mercado',
            differentiator: 'Qué los diferencia de los demás',
          },
        ],
        marketGaps: ['Oportunidad de mercado 1', 'Oportunidad de mercado 2'],
        threatLevel: 'bajo | medio | alto',
        recommendation: 'Recomendación estratégica para diferenciarse (2-3 párrafos)',
        keyInsights: ['Insight 1', 'Insight 2', 'Insight 3'],
      },
    });

    return this.llm.chatJson<Record<string, unknown>>(systemPrompt, userPrompt, {
      taskType: 'competitor_intel',
      temperature: 0.5,
    });
  }
}