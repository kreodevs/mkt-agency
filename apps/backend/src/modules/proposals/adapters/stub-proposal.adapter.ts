import { Injectable } from '@nestjs/common';
import {
  GeneratedProposalContent,
  ProposalAdapterPort,
  ProposalGenerationContext,
} from './proposal.adapter.port';

@Injectable()
export class StubProposalAdapter implements ProposalAdapterPort {
  async generate(context: ProposalGenerationContext): Promise<GeneratedProposalContent> {
    const campaignName = context.campaign?.name ?? context.title;
    const budgetTotal = context.campaign?.totalBudget ?? 5000;
    const platforms =
      context.campaign?.platforms?.length ? context.campaign.platforms : ['facebook', 'instagram'];

    return {
      summary: `Propuesta comercial para ${campaignName} orientada a ${context.companyProfile?.objectives ?? 'crecimiento de marca y generación de leads'}.`,
      objectives: [
        'Incrementar visibilidad de marca en canales digitales',
        'Generar leads cualificados con CPL optimizado',
        'Establecer presencia coherente con la identidad de marca',
      ],
      strategy: `Despliegue multicanal en ${platforms.join(', ')} con creatividades adaptadas al tono ${context.companyProfile?.brandVoice ?? 'profesional'} y audiencia ${context.companyProfile?.targetAudienceDesc ?? 'B2B/B2C local'}.`,
      budget: {
        total: budgetTotal,
        breakdown: [
          { item: 'Medios pagados', amount: Math.round(budgetTotal * 0.6) },
          { item: 'Producción creativa', amount: Math.round(budgetTotal * 0.25) },
          { item: 'Analítica y optimización', amount: Math.round(budgetTotal * 0.15) },
        ],
      },
      timeline: [
        { phase: 'Discovery y setup', duration: '2 semanas' },
        { phase: 'Lanzamiento y optimización', duration: '6 semanas' },
        { phase: 'Reporting y ajustes', duration: '2 semanas' },
      ],
      deliverables: [
        'Plan de medios detallado',
        'Calendario editorial',
        'Dashboard de KPIs',
        'Informe mensual de rendimiento',
      ],
    };
  }
}
