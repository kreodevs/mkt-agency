import { Injectable } from '@nestjs/common';
import {
  SuggestionAdapterPort,
  SuggestionContext,
} from './suggestion.adapter.port';

@Injectable()
export class StubSuggestionAdapter implements SuggestionAdapterPort {
  async generate(context: SuggestionContext): Promise<Record<string, unknown>> {
    const company = context.profile.companyName ?? 'tu empresa';
    const industry = context.profile.industry ?? 'tu sector';

    const templates: Record<string, Record<string, unknown>> = {
      company_name: { companyName: `${company} Marketing` },
      industry: { industry: industry === 'tu sector' ? 'services' : industry },
      website: { website: `https://www.${slugify(company)}.com` },
      brand_voice: {
        brandVoice:
          'Tono profesional y cercano. Comunicación clara, orientada a resultados y confianza.',
      },
      target_audience_desc: {
        targetAudienceDesc:
          'Pequeñas empresas y emprendedores que buscan crecer con marketing digital accesible.',
      },
      competitors: {
        competitors: 'Competidor A\nCompetidor B\nCompetidor local referente',
      },
      objectives: {
        objectives:
          'Aumentar reconocimiento de marca\nGenerar leads cualificados\nMejorar conversión web',
      },
      visual_preferences: {
        style: 'Moderno y minimalista',
        primaryColor: '#C9A227',
      },
    };

    return templates[context.sectionKey] ?? {};
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'mi-empresa';
}
