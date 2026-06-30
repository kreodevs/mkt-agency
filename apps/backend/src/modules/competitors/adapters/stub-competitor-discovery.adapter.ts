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

    const sector = context.industry ?? 'tu sector';

    return [
      {
        name: 'Competidor Alpha',
        website: 'competidor-alpha.com',
        industry: sector,
        rationale: `Referente en ${scopeHint} con propuesta similar.`,
      },
      {
        name: 'Competidor Beta',
        website: 'competidor-beta.com',
        industry: sector,
        rationale: `Alternativa popular para la audiencia objetivo en ${scopeHint}.`,
      },
      {
        name: 'Competidor Gamma',
        website: null,
        industry: sector,
        rationale: 'Operador regional con enfoque en precio.',
      },
    ];
  }
}
