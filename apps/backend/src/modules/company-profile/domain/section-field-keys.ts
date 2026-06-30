import { SectionKey } from './section-keys';

/** Claves JSON permitidas por sección (alineado a onboarding-sections.ts). */
export const SECTION_FIELD_KEYS: Record<SectionKey, readonly string[]> = {
  company_name: ['companyName'],
  industry: ['industry'],
  website: ['website'],
  brand_voice: ['brandVoice'],
  target_audience_desc: ['targetAudienceDesc'],
  competitors: ['competitors'],
  objectives: ['objectives'],
  visual_preferences: ['style', 'primaryColor'],
};

export function pickSectionSuggestionFields(
  sectionKey: SectionKey,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = SECTION_FIELD_KEYS[sectionKey];
  const flat = flattenSectionPayload(raw);
  const picked: Record<string, unknown> = {};

  for (const key of allowed) {
    const value = flat[key];
    if (value != null && String(value).trim() !== '') {
      picked[key] = value;
    }
  }

  return picked;
}

function flattenSectionPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...raw };

  for (const value of Object.values(raw)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, value as Record<string, unknown>);
    }
  }

  return result;
}
