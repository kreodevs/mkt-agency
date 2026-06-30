import { Injectable } from '@nestjs/common';
import {
  CompetitorDiscoveryAdapterPort,
  CompetitorDiscoveryContext,
  DiscoveredCompetitorResult,
} from './competitor-discovery.adapter.port';

@Injectable()
export class StubCompetitorDiscoveryAdapter implements CompetitorDiscoveryAdapterPort {
  async discover(context: CompetitorDiscoveryContext): Promise<DiscoveredCompetitorResult[]> {
    const scopeHint =
      context.scope === 'global'
        ? 'global'
        : context.scope === 'country'
          ? context.country ?? 'tu país'
          : `${context.city ?? 'tu ciudad'}, ${context.country ?? ''}`.trim();

    const sector = context.industryLabel ?? context.industry ?? 'tu sector';
    const industryCode = (context.industry ?? '').toLowerCase();

    if (industryCode === 'tech' || /software|saas|marketing|agencia/.test(sector.toLowerCase())) {
      return [
        {
          name: 'Metricool',
          website: 'metricool.com',
          industry: 'Marketing / social media SaaS',
          rationale: `Plataforma de gestión de redes y analítica para pymes en ${scopeHint}.`,
        },
        {
          name: 'Hootsuite',
          website: 'hootsuite.com',
          industry: 'Social media management',
          rationale: 'Alternativa global para programar y medir contenido orgánico.',
        },
        {
          name: 'Buffer',
          website: 'buffer.com',
          industry: 'Marketing SaaS',
          rationale: 'Herramienta de publicación y calendario editorial para equipos pequeños.',
        },
      ];
    }

    return [
      {
        name: 'Competidor Alpha',
        website: 'competidor-alpha.com',
        industry: sector,
        rationale: `Referente en ${scopeHint} con propuesta similar en ${sector}.`,
      },
      {
        name: 'Competidor Beta',
        website: 'competidor-beta.com',
        industry: sector,
        rationale: `Alternativa para la audiencia objetivo en ${scopeHint}.`,
      },
      {
        name: 'Competidor Gamma',
        website: null,
        industry: sector,
        rationale: 'Operador regional con enfoque comparable en el mismo rubro.',
      },
    ];
  }
}
