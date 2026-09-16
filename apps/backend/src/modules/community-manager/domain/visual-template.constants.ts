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

/** Pure IA art / infographics — skips SVG templates and creative-scene routing. */
export const AI_ART_TEMPLATE_ID = 'ai-art';

/** Creative scene archetypes (persisted in contents.visual_scene). */
export const VISUAL_SCENE_IDS = [
  'workspace',
  'clinical',
  'hand-phone',
  'abstract-premium',
] as const;

export type VisualSceneId = (typeof VISUAL_SCENE_IDS)[number];

/** Allowed values for PATCH/POST contents.visualTemplateId (templates + pipeline presets). */
export const VISUAL_DESIGN_PRESET_IDS = [
  ...VISUAL_TEMPLATE_IDS,
  CREATIVE_SCENE_TEMPLATE_ID,
  AI_ART_TEMPLATE_ID,
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

export function isAiArtTemplateId(value: string | null | undefined): boolean {
  return value?.trim() === AI_ART_TEMPLATE_ID;
}

export function isCreativeSceneTemplateId(value: string | null | undefined): boolean {
  return value?.trim() === CREATIVE_SCENE_TEMPLATE_ID;
}

export function isVisualSceneId(value: string | null | undefined): value is VisualSceneId {
  return (
    typeof value === 'string' && (VISUAL_SCENE_IDS as readonly string[]).includes(value)
  );
}

export const DEFAULT_VISUAL_TEMPLATE: VisualTemplateId = 'product-hero';

export const CAROUSEL_VISUAL_TEMPLATE: VisualTemplateId = 'promo-cta';

export const MEDIA_KIT_RECOMMENDED_MIN_IMAGES = 3;
