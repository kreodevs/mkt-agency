export const VISUAL_TEMPLATE_IDS = [
  'product-hero',
  'tip-card',
  'quote-insight',
  'promo-cta',
  'stat-highlight',
  'story-vertical',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

export const VISUAL_TEMPLATE_LABELS: Record<VisualTemplateId, string> = {
  'product-hero': 'Hero de producto (split / mockup)',
  'tip-card': 'Tip educativo (mockup)',
  'quote-insight': 'Cita / insight editorial',
  'promo-cta': 'Promoción con CTA',
  'stat-highlight': 'Dato destacado',
  'story-vertical': 'Story vertical (9:16)',
};

export function isVisualTemplateId(value: string | null | undefined): value is VisualTemplateId {
  return VISUAL_TEMPLATE_IDS.includes(value as VisualTemplateId);
}

export function visualTemplateLabel(templateId: string | null | undefined): string | null {
  if (!isVisualTemplateId(templateId)) {
    return null;
  }
  return VISUAL_TEMPLATE_LABELS[templateId];
}
