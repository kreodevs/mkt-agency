export const VISUAL_TEMPLATE_IDS = [
  'product-hero',
  'tip-card',
  'quote-insight',
  'promo-cta',
  'stat-highlight',
  'story-vertical',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

/** Pipeline preset stored in contents.visual_template_id — not a Visual Studio SVG template. */
export const CREATIVE_SCENE_TEMPLATE_ID = 'creative-scene';

/** Allowed values for PATCH/POST contents.visualTemplateId (templates + pipeline presets). */
export const VISUAL_DESIGN_PRESET_IDS = [
  ...VISUAL_TEMPLATE_IDS,
  CREATIVE_SCENE_TEMPLATE_ID,
] as const;

export type VisualDesignPresetId = (typeof VISUAL_DESIGN_PRESET_IDS)[number];

export function isVisualDesignPresetId(
  value: string | null | undefined,
): value is VisualDesignPresetId {
  return (
    typeof value === 'string' &&
    (VISUAL_DESIGN_PRESET_IDS as readonly string[]).includes(value)
  );
}

export const DEFAULT_VISUAL_TEMPLATE: VisualTemplateId = 'product-hero';

export const CAROUSEL_VISUAL_TEMPLATE: VisualTemplateId = 'promo-cta';

export const MEDIA_KIT_RECOMMENDED_MIN_IMAGES = 3;
