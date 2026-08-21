import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { CompetitorIntelContext } from '../domain/competitor-intel-context.util';
import { CompetitorIntelAdapterPort } from './competitor-intel.adapter.port';

@Injectable()
export class OpenRouterCompetitorIntelAdapter implements CompetitorIntelAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generateAnalysis(
    competitors: string,
    tenantContext: CompetitorIntelContext,
  ): Promise<Record<string, unknown>> {
    const companyLabel = tenantContext.companyName?.trim() || 'Tu empresa';

    const systemPrompt =
      'Eres un analista de mercado senior especializado en inteligencia competitiva. ' +
      'Analiza los competidores proporcionados y genera un reporte estratégico en español. ' +
      `Incluye SIEMPRE la posición de "${companyLabel}" frente a los competidores y sus ventajas competitivas concretas, ` +
      'usando el contexto de la empresa analizada (no la trates como un competidor más en la lista). ' +
      'Responde SOLO con un objeto JSON válido, sin markdown.';

    const userPrompt = JSON.stringify({
      task: 'Realizar un análisis competitivo profundo de los siguientes competidores.',
      companyBeingAnalyzed: {
        ...tenantContext,
        note:
          'Esta es la empresa del cliente. Evalúa su posición relativa y ventajas frente a los competidores listados.',
      },
      competitors,
      outputFormat: {
        competitorLandscape: 'Análisis general del panorama competitivo (2-3 párrafos)',
        ourPosition:
          'Posición de la empresa del cliente en el mercado frente a los competidores analizados (1-2 párrafos)',
        competitiveAdvantages: [
          'Ventaja competitiva concreta 1',
          'Ventaja competitiva concreta 2',
          'Ventaja competitiva concreta 3',
        ],
        positioningVsCompetitors: [
          {
            competitor: 'Nombre del competidor',
            comparison:
              'Cómo se compara la empresa del cliente con este competidor en 1-2 frases',
          },
        ],
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