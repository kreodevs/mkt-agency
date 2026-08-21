import { Injectable } from '@nestjs/common';
import { CompetitorIntelContext } from '../domain/competitor-intel-context.util';
import { CompetitorIntelAdapterPort } from './competitor-intel.adapter.port';

@Injectable()
export class StubCompetitorIntelAdapter implements CompetitorIntelAdapterPort {
  async generateAnalysis(
    competitors: string,
    tenantContext: CompetitorIntelContext,
  ): Promise<Record<string, unknown>> {
    const list = competitors.split('\n').filter(Boolean);
    const companyName = tenantContext.companyName?.trim() || 'Tu empresa';
    const industry = tenantContext.industry ?? 'tu sector';

    return {
      competitorLandscape: `Análisis preliminar del mercado de ${industry}. Los competidores identificados operan en un mercado competitivo con espacio para diferenciación.`,
      ourPosition: `${companyName} se sitúa como alternativa emergente en ${industry}, con oportunidad de capturar segmentos desatendidos por soluciones más complejas o genéricas.`,
      competitiveAdvantages: [
        tenantContext.valueProposition?.trim() ||
          'Propuesta de valor enfocada en las necesidades específicas de tu audiencia',
        'Mayor agilidad operativa frente a competidores con implementaciones pesadas',
        'Enfoque en experiencia de usuario adaptada al mercado local',
      ],
      positioningVsCompetitors: list.slice(0, 3).map((name) => ({
        competitor: name.trim(),
        comparison: `${companyName} puede diferenciarse de ${name.trim()} ofreciendo una experiencia más accesible y alineada a tu propuesta de valor.`,
      })),
      competitors: list.map((name) => ({
        name: name.trim(),
        overview: `${name.trim()} es un competidor en el espacio de ${industry}.`,
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