export const BRAND_VISUAL_KIT_METADATA_KEY = 'brandVisualKit';

export type BrandVisualStyle = 'minimal' | 'bold' | 'luxury';

const DEFAULT_FONT_FAMILY = '"Helvetica Neue", Arial, sans-serif';

export interface ProductBrandVisualKit {
  style: BrandVisualStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Familia tipográfica CSS para titulares en plantillas SVG. */
  fontFamily?: string;
  updatedAt?: string;
}

const DEFAULT_PRIMARY = '#c2410c';
const DEFAULT_SECONDARY = '#141413';
const DEFAULT_ACCENT = '#fff7ed';

export function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
}

export function normalizeBrandVisualStyle(value: unknown): BrandVisualStyle {
  if (value === 'bold' || value === 'luxury' || value === 'minimal') {
    return value;
  }
  return 'minimal';
}

export function getProductBrandVisualKit(
  metadata: Record<string, unknown> | null | undefined,
): ProductBrandVisualKit | null {
  const raw = metadata?.[BRAND_VISUAL_KIT_METADATA_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const fontFamily =
    typeof record.fontFamily === 'string' && record.fontFamily.trim().length > 0
      ? record.fontFamily.trim().slice(0, 120)
      : undefined;

  return {
    style: normalizeBrandVisualStyle(record.style),
    primaryColor: normalizeHexColor(record.primaryColor, DEFAULT_PRIMARY),
    secondaryColor: normalizeHexColor(record.secondaryColor, DEFAULT_SECONDARY),
    accentColor: normalizeHexColor(record.accentColor, DEFAULT_ACCENT),
    fontFamily,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
  };
}

export function normalizeBrandFontFamily(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_FONT_FAMILY;
  }
  const sanitized = value.trim().replace(/[^a-zA-Z0-9 ,'"-]/g, '').slice(0, 120);
  return sanitized || DEFAULT_FONT_FAMILY;
}

export function mergeBrandVisualKitMetadata(
  metadata: Record<string, unknown> | null | undefined,
  kit: ProductBrandVisualKit,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [BRAND_VISUAL_KIT_METADATA_KEY]: {
      ...kit,
      updatedAt: new Date().toISOString(),
    },
  };
}

export { DEFAULT_ACCENT, DEFAULT_PRIMARY, DEFAULT_SECONDARY };
