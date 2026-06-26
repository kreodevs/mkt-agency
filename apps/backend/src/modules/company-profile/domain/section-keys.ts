export const MANDATORY_SECTION_KEYS = [
  'company_name',
  'industry',
  'website',
  'brand_voice',
  'target_audience_desc',
] as const;

export type MandatorySectionKey = (typeof MANDATORY_SECTION_KEYS)[number];

export const ALL_SECTION_KEYS = [
  ...MANDATORY_SECTION_KEYS,
  'competitors',
  'objectives',
  'visual_preferences',
] as const;

export type SectionKey = (typeof ALL_SECTION_KEYS)[number];

export const COMPLETION_THRESHOLD = 80;
