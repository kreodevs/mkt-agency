export const VISUAL_TEMPLATE_IDS = [
  'product-hero',
  'tip-card',
  'quote-insight',
  'promo-cta',
  'stat-highlight',
  'story-vertical',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

export const DEFAULT_VISUAL_TEMPLATE: VisualTemplateId = 'product-hero';

export const CAROUSEL_VISUAL_TEMPLATE: VisualTemplateId = 'tip-card';

export const MEDIA_KIT_RECOMMENDED_MIN_IMAGES = 3;
