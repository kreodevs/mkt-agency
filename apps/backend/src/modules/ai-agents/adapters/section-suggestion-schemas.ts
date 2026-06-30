import { SectionKey } from '../../company-profile/domain/section-keys';

export const SECTION_SUGGESTION_SCHEMAS: Record<SectionKey, Record<string, string>> = {
  company_name: { companyName: 'string — nombre comercial' },
  industry: { industry: 'string — retail | services | health | tech | other' },
  website: { website: 'string — URL https://...' },
  brand_voice: { brandVoice: 'string — tono y personalidad de marca' },
  target_audience_desc: { targetAudienceDesc: 'string — descripción del cliente ideal' },
  competitors: { competitors: 'string — competidores, uno por línea' },
  objectives: { objectives: 'string — objetivos de marketing, uno por línea' },
  visual_preferences: {
    style: 'string — estilo visual (ej. minimalista, corporativo)',
    primaryColor: 'string — color hex (#RRGGBB)',
  },
};

export function buildSectionOutputHint(sectionKey: SectionKey): string {
  const schema = SECTION_SUGGESTION_SCHEMAS[sectionKey];
  return (
    `Devuelve SOLO un objeto JSON con exactamente estas claves (sin otras): ${JSON.stringify(schema)}. ` +
    'No incluyas datos de otras secciones del perfil.'
  );
}
