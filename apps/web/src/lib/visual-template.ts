export const VISUAL_TEMPLATE_IDS = [
  'product-hero',
  'tip-card',
  'quote-insight',
  'promo-cta',
  'stat-highlight',
  'story-vertical',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

/** Pipeline preset stored in visualTemplateId — not a Visual Studio SVG template. */
export const CREATIVE_SCENE_TEMPLATE_ID = 'creative-scene';

export type VisualDesignPresetId = VisualTemplateId | typeof CREATIVE_SCENE_TEMPLATE_ID | '';

export const VISUAL_TEMPLATE_LABELS: Record<VisualTemplateId, string> = {
  'product-hero': 'Mockup con captura real del app',
  'tip-card': 'Tip educativo (plantilla + mockup)',
  'quote-insight': 'Cita / insight editorial',
  'promo-cta': 'Promoción con CTA + captura',
  'stat-highlight': 'Dato destacado',
  'story-vertical': 'Story vertical (9:16)',
};

export const VISUAL_DESIGN_PRESET_LABELS: Record<string, string> = {
  '': 'Automática (según post y media kit)',
  [CREATIVE_SCENE_TEMPLATE_ID]: 'Escena creativa CM (lifestyle, sin captura)',
  ...VISUAL_TEMPLATE_LABELS,
};

export const VISUAL_DESIGN_PRESET_HINTS: Partial<Record<string, string>> = {
  '': 'Escena fotorealista o mockup según el objetivo del post.',
  [CREATIVE_SCENE_TEMPLATE_ID]:
    'CM en consultorio/oficina. No inserta capturas del app (ideal para confianza, tips, marca).',
  'product-hero': 'Fondo IA + dispositivo con captura real del media kit (muestra la app).',
  'tip-card': 'Plantilla tipográfica con mockup opcional.',
  'quote-insight': 'Solo tipografía — sin capturas.',
  'promo-cta': 'Promo con CTA y captura del kit si está disponible.',
  'stat-highlight': 'Dato numérico destacado — plantilla rígida.',
  'story-vertical': 'Formato vertical 9:16 para stories/Reels.',
};

export const VISUAL_DESIGN_SELECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: VISUAL_DESIGN_PRESET_LABELS[''] },
  { value: CREATIVE_SCENE_TEMPLATE_ID, label: VISUAL_DESIGN_PRESET_LABELS[CREATIVE_SCENE_TEMPLATE_ID] },
  ...VISUAL_TEMPLATE_IDS.map((id) => ({
    value: id,
    label: VISUAL_TEMPLATE_LABELS[id],
  })),
];

export function isVisualTemplateId(value: string | null | undefined): value is VisualTemplateId {
  return VISUAL_TEMPLATE_IDS.includes(value as VisualTemplateId);
}

export function isCreativeScenePreset(value: string | null | undefined): boolean {
  return value === CREATIVE_SCENE_TEMPLATE_ID;
}

/** SVG templates with fixed text slots; scene/IA presets skip typographic line-wrap checks. */
export function usesTypographicVisualTemplate(
  value: string | null | undefined,
): value is VisualTemplateId {
  return isVisualTemplateId(value);
}

export function visualTemplateLabel(templateId: string | null | undefined): string | null {
  if (!templateId) {
    return null;
  }
  return VISUAL_DESIGN_PRESET_LABELS[templateId] ?? null;
}
