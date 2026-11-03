export const VISUAL_TEMPLATE_IDS = [
  'product-hero',
  'promo-cta',
] as const;

export type VisualTemplateId = (typeof VISUAL_TEMPLATE_IDS)[number];

/** Pipeline preset stored in visualTemplateId — not a Visual Studio SVG template. */
export const CREATIVE_SCENE_TEMPLATE_ID = 'creative-scene';

/** Pure IA art / infographics — skips SVG templates. */
export const AI_ART_TEMPLATE_ID = 'ai-art';

export const VISUAL_SCENE_IDS = [
  'workspace',
  'clinical',
  'hand-phone',
  'abstract-premium',
] as const;

export type VisualSceneId = (typeof VISUAL_SCENE_IDS)[number];

export type VisualDesignPresetId =
  | VisualTemplateId
  | typeof CREATIVE_SCENE_TEMPLATE_ID
  | typeof AI_ART_TEMPLATE_ID
  | '';

export type VisualPresetKind = 'auto' | 'scene' | 'mockup' | 'ai-art';

export const VISUAL_PRESET_KIND_LABELS: Record<VisualPresetKind, string> = {
  auto: 'Automática',
  scene: 'Escena CM',
  mockup: 'Mockup con captura',
  'ai-art': 'Arte IA',
};

export const VISUAL_TEMPLATE_LABELS: Record<VisualTemplateId, string> = {
  'product-hero': 'Producto / funcionalidad',
  'promo-cta': 'Promo con CTA',
};

export const VISUAL_DESIGN_PRESET_LABELS: Record<string, string> = {
  '': 'Automática — el motor decide',
  [CREATIVE_SCENE_TEMPLATE_ID]: 'Escena CM — foto lifestyle, sin app',
  [AI_ART_TEMPLATE_ID]: 'Arte IA — infografía o ilustración',
  ...VISUAL_TEMPLATE_LABELS,
  // Fallbacks de lectura para registros legados
  'tip-card': 'Tip educativo (legado)',
  'quote-insight': 'Cita / insight (legado)',
  'stat-highlight': 'Dato destacado (legado)',
  'story-vertical': 'Story vertical (legado)',
};

export const VISUAL_DESIGN_PRESET_KINDS: Record<string, VisualPresetKind> = {
  '': 'auto',
  [CREATIVE_SCENE_TEMPLATE_ID]: 'scene',
  [AI_ART_TEMPLATE_ID]: 'ai-art',
  'product-hero': 'mockup',
  'promo-cta': 'mockup',
  // Legados normalizados a mockup / scene
  'tip-card': 'mockup',
  'quote-insight': 'scene',
  'stat-highlight': 'mockup',
  'story-vertical': 'mockup',
};

export const VISUAL_DESIGN_PRESET_HINTS: Partial<Record<string, string>> = {
  '':
    'El sistema elige automáticamente entre mockup con captura o escena fotográfica según el post, el media kit y la red social.',
  [CREATIVE_SCENE_TEMPLATE_ID]:
    'Genera una foto fotorrealista de alto impacto de la presentadora o ambiente del nicho (consultorio, eventos, oficina moderna). Incluye titular y botón CTA.',
  [AI_ART_TEMPLATE_ID]:
    'Ilustración o arte conceptual 100 % generado por IA para conceptos visuales o metáforas visuales.',
  'product-hero':
    'Dispositivo real (MacBook, iPad o iPhone) mostrando la interfaz de la app en un entorno o fondo de marca de alta conversión.',
  'promo-cta': 'Mockup con captura real, orientado a conversión directa y botón de acción destacado.',
};

/** Guía rápida para distinguir los tres modos que más se confunden. */
export const VISUAL_STYLE_GUIDE_ROWS: Array<{
  kind: VisualPresetKind;
  generates: string;
  showsApp: string;
}> = [
  {
    kind: 'auto',
    generates: 'Lo que encaje con el post',
    showsApp: 'Solo si el objetivo lo pide',
  },
  {
    kind: 'scene',
    generates: 'Foto lifestyle con CM',
    showsApp: 'No',
  },
  {
    kind: 'mockup',
    generates: 'Dispositivo + captura real',
    showsApp: 'Sí',
  },
];

export const VISUAL_SCENE_LABELS: Record<VisualSceneId, string> = {
  workspace: 'Oficina / SaaS',
  clinical: 'Clínica / consultorio',
  'hand-phone': 'Mano con móvil (stories)',
  'abstract-premium': 'Marca abstracta (sin personas)',
};

export const VISUAL_SCENE_SELECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Automática (según industria y plataforma)' },
  ...VISUAL_SCENE_IDS.map((id) => ({
    value: id,
    label: VISUAL_SCENE_LABELS[id],
  })),
];

export const VISUAL_DESIGN_SELECT_OPTION_GROUPS: Array<{
  label: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    label: 'Recomendado',
    options: [{ value: '', label: VISUAL_DESIGN_PRESET_LABELS[''] }],
  },
  {
    label: 'Mockup — captura real del producto',
    options: [
      { value: 'product-hero', label: VISUAL_DESIGN_PRESET_LABELS['product-hero'] },
      { value: 'promo-cta', label: VISUAL_DESIGN_PRESET_LABELS['promo-cta'] },
    ],
  },
  {
    label: 'Fotografía CM — escena de ambiente',
    options: [{ value: CREATIVE_SCENE_TEMPLATE_ID, label: VISUAL_DESIGN_PRESET_LABELS[CREATIVE_SCENE_TEMPLATE_ID] }],
  },
  {
    label: 'Arte IA — imagen conceptual o ilustración',
    options: [{ value: AI_ART_TEMPLATE_ID, label: VISUAL_DESIGN_PRESET_LABELS[AI_ART_TEMPLATE_ID] }],
  },
];

export function resolveVisualPresetKind(templateId: string | null | undefined): VisualPresetKind {
  if (!templateId) {
    return 'auto';
  }
  return VISUAL_DESIGN_PRESET_KINDS[templateId] ?? 'mockup';
}

export function isVisualTemplateId(value: string | null | undefined): value is VisualTemplateId {
  return VISUAL_TEMPLATE_IDS.includes(value as VisualTemplateId);
}

export function isCreativeScenePreset(value: string | null | undefined): boolean {
  return value === CREATIVE_SCENE_TEMPLATE_ID;
}

export function isAiArtPreset(value: string | null | undefined): boolean {
  return value === AI_ART_TEMPLATE_ID;
}

export function isPipelineVisualPreset(value: string | null | undefined): boolean {
  return isCreativeScenePreset(value) || isAiArtPreset(value);
}

export function isVisualDesignPreset(value: string | null | undefined): boolean {
  return isPipelineVisualPreset(value) || isVisualTemplateId(value);
}

export function isVisualSceneId(value: string | null | undefined): value is VisualSceneId {
  return VISUAL_SCENE_IDS.includes(value as VisualSceneId);
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
