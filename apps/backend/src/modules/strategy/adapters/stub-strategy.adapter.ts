import { Injectable } from '@nestjs/common';
import {
  StrategyAdjustmentAdapterPort,
  StrategyAnalysisData,
} from './strategy.adapter.port';

@Injectable()
export class StubStrategyAdapter implements StrategyAdjustmentAdapterPort {
  async analyze(context: Parameters<StrategyAdjustmentAdapterPort['analyze']>[0]): Promise<StrategyAnalysisData> {
    return {
      summary: 'Análisis simulado: el rendimiento general es estable. Se detectan oportunidades en canales de contenido orgánico.',
      overallHealth: 'fair',
      topPerforming: [
        'El contenido de blog tiene buena tracción orgánica',
        'La tasa de apertura de emails es superior al promedio',
      ],
      underperforming: [
        'La conversión de leads en etapa "interesado" a "cliente" es baja',
        'Las campañas en Instagram tienen bajo engagement últimamente',
      ],
      suggestions: [
        {
          id: 'sug-1',
          channel: 'Instagram',
          currentPerformance: 'Engagement bajo en últimas 2 semanas',
          insight: 'El contenido visual no está conectando con la audiencia actual',
          recommendation: 'Cambiar a contenido educativo en Reels y reducir publicaciones promocionales',
          actionType: 'adjust_content',
          expectedImpact: 'Aumentar engagement en un 30% en 2 semanas',
          status: 'pending',
        },
        {
          id: 'sug-2',
          channel: 'Email Marketing',
          currentPerformance: 'Buena apertura pero baja conversión',
          insight: 'Los CTAs no están alineados con la etapa del lead en el embudo',
          recommendation: 'Segmentar campañas por etapa del lead y personalizar CTAs',
          actionType: 'adjust_content',
          expectedImpact: 'Aumentar conversión en etapa de prueba en 15%',
          status: 'pending',
        },
        {
          id: 'sug-3',
          channel: 'Blog / SEO',
          currentPerformance: 'Tráfico orgánico creciendo',
          insight: 'Los artículos de fondo tienen mejor rendimiento que noticias',
          recommendation: 'Aumentar frecuencia de artículos long-form y reducir noticias',
          actionType: 'amplify',
          expectedImpact: 'Duplicar tráfico orgánico en 1 mes',
          status: 'pending',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}