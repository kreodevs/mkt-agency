import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  SuggestionAdapterPort,
  SuggestionContext,
} from './suggestion.adapter.port';

const SECTION_LABELS: Record<string, string> = {
  company_name: 'nombre de la empresa',
  industry: 'industria o sector',
  website: 'sitio web',
  brand_voice: 'tono de marca y voz',
  target_audience_desc: 'descripción del público objetivo',
  competitors: 'competidores principales',
  objectives: 'objetivos de marketing',
  visual_preferences: 'preferencias visuales (colores, estilo)',
};

@Injectable()
export class OpenRouterSuggestionAdapter implements SuggestionAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generate(context: SuggestionContext): Promise<Record<string, unknown>> {
    const label = SECTION_LABELS[context.sectionKey] ?? context.sectionKey;

    const systemPrompt =
      'Eres un consultor de marketing B2B. Responde SOLO con un objeto JSON válido, sin markdown, ' +
      'con campos que encajen en el perfil de empresa del cliente. Usa español neutro profesional.';

    const userPrompt = JSON.stringify({
      task: `Sugerir contenido para la sección "${label}" del perfil de empresa.`,
      sectionKey: context.sectionKey,
      companyProfile: context.profile,
      currentSectionData: context.currentSectionData,
      outputHint:
        'Devuelve un objeto JSON con las claves apropiadas para esta sección (ej. companyName, brandVoice, objectives como string multilínea, visual_preferences con style y primaryColor).',
    });

    const result = await this.llm.chatJson<Record<string, unknown>>(
      systemPrompt,
      userPrompt,
    );

    return result ?? {};
  }
}
