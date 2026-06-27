import { Injectable } from '@nestjs/common';
import { CompetitorIntelAdapterPort } from './competitor-intel.adapter.port';

@Injectable()
export class StubCompetitorIntelAdapter implements CompetitorIntelAdapterPort {
  async generateAnalysis(
    competitors: string,
    tenantContext: {
      companyName?: string | null;
      industry?: string | null;
      targetAudience?: string | null;
    },
  ): Promise<Record<string, unknown>> {
    const list = competitors.split('\n').filter(Boolean);
    return {
      competitorLandscape: `Análisis preliminar del mercado de ${tenantContext.industry ?? 'tu sector'}. Los competidores identificados operan en un mercado competitivo con espacio para diferenciación.`,
      competitors: list.map((name) => ({
        name: name.trim(),
        overview: `${name.trim()} es un competidor en el espacio de ${tenantContext.industry ?? 'tu industria'}.`,
        strengths: ['Presencia de marca', 'Base de clientes establecida'],
        weaknesses: ['Oferta limitada en ciertos segmentos'],
        marketPosition: 'Posición intermedia en el mercado',
        differentiator: 'Su enfoque tradicional y experiencia en el sector',
      })),
      marketGaps: [
        'Segmentos desatendidos que buscan soluciones más personalizadas',
        'Oportunidad en precios más accesibles',
      ],
      threatLevel: 'medio',
      recommendation: 'Conecta un proveedor LLM para generar un análisis competitivo completo con IA.',
      keyInsights: [
        'El mercado tiene espacio para un nuevo competidor con propuesta diferenciada',
        'Los competidores existentes tienen debilidades en atención al cliente',
      ],
    };
  }
}