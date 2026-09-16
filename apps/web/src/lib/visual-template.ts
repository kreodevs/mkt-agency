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

export type VisualPresetKind = 'auto' | 'scene' | 'mockup' | 'ai-art' | 'template';

export const VISUAL_PRESET_KIND_LABELS: Record<VisualPresetKind, string> = {
  auto: 'Automática',
  scene: 'Escena CM',
  mockup: 'Mockup con captura',
  'ai-art': 'Arte IA',
  template: 'Plantilla tipográfica',
};

export const VISUAL_TEMPLATE_LABELS: Record<VisualTemplateId, string> = {
  'product-hero': 'Producto / funcionalidad',
  'tip-card': 'Tip educativo',
  'quote-insight': 'Cita / insight',
  'promo-cta': 'Promo con CTA',
  'stat-highlight': 'Dato destacado',
  'story-vertical': 'Story vertical (9:16)',
};

export const VISUAL_DESIGN_PRESET_LABELS: Record<string, string> = {
  '': 'Automática — el motor decide',
  [CREATIVE_SCENE_TEMPLATE_ID]: 'Escena CM — foto lifestyle, sin app',
  [AI_ART_TEMPLATE_ID]: 'Arte IA — infografía o ilustración',
  ...VISUAL_TEMPLATE_LABELS,
};

export const VISUAL_DESIGN_PRESET_KINDS: Record<string, VisualPresetKind> = {
  '': 'auto',
  [CREATIVE_SCENE_TEMPLATE_ID]: 'scene',
  [AI_ART_TEMPLATE_ID]: 'ai-art',
  'product-hero': 'mockup',
  'promo-cta': 'mockup',
  'tip-card': 'template',
  'quote-insight': 'template',
  'stat-highlight': 'template',
  'story-vertical': 'template',
};

export const VISUAL_DESIGN_PRESET_HINTS: Partial<Record<string, string>> = {
  '':
    'El sistema elige entre escena CM, mockup con captura o plantilla según el post, el media kit y la red social. Úsala si no estás seguro.',
  [CREATIVE_SCENE_TEMPLATE_ID]:
    'Genera una foto realista con la CM en consultorio u oficina. No superpone capturas del producto — ideal para confianza, tips de marca o educación sin mostrar la UI.',
  [AI_ART_TEMPLATE_ID]:
    'Ilustración o infografía 100 % generada por IA. Sin CM en escena, sin mockup de dispositivo y sin marcos tipográficos SVG.',
  'product-hero':
    'Fondo creativo + dispositivo (móvil o desktop según la captura) con la screenshot real del media kit. Úsalo cuando el post debe mostrar la app.',
  'tip-card': 'Marco tipográfico con titular y subtítulo; puede incluir mockup si hay capturas en el kit.',
  'quote-insight': 'Solo textos sobre fondo editorial — sin personas ni capturas de producto.',
  'promo-cta': 'Igual que mockup con captura, orientado a promoción y botón de CTA visible.',
  'stat-highlight': 'Plantilla rígida para un dato numérico grande y contexto breve.',
  'story-vertical': 'Plantilla vertical 9:16 para stories o Reels estáticos.',
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
    label: 'Fotografía CM — sin captura de app',
    options: [{ value: CREATIVE_SCENE_TEMPLATE_ID, label: VISUAL_DESIGN_PRESET_LABELS[CREATIVE_SCENE_TEMPLATE_ID] }],
  },
  {
    label: 'Mockup — captura real del producto',
    options: [
      { value: 'product-hero', label: VISUAL_DESIGN_PRESET_LABELS['product-hero'] },
      { value: 'promo-cta', label: VISUAL_DESIGN_PRESET_LABELS['promo-cta'] },
    ],
  },
  {
    label: 'Arte IA — sin plantilla SVG',
    options: [{ value: AI_ART_TEMPLATE_ID, label: VISUAL_DESIGN_PRESET_LABELS[AI_ART_TEMPLATE_ID] }],
  },
  {
    label: 'Plantilla tipográfica — textos en marco fijo',
    options: VISUAL_TEMPLATE_IDS
      .filter((id) => id !== 'product-hero' && id !== 'promo-cta')
      .map((id) => ({
        value: id,
        label: VISUAL_DESIGN_PRESET_LABELS[id],
      })),
  },
];

export function resolveVisualPresetKind(templateId: string | null | undefined): VisualPresetKind {
  if (!templateId) {
    return 'auto';
  }
  return VISUAL_DESIGN_PRESET_KINDS[templateId] ?? 'template';
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
