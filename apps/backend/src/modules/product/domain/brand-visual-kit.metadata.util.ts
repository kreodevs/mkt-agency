export const BRAND_VISUAL_KIT_METADATA_KEY = 'brandVisualKit';

export type BrandVisualStyle = 'minimal' | 'bold' | 'luxury';

export interface ProductBrandVisualKit {
  style: BrandVisualStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
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
  return {
    style: normalizeBrandVisualStyle(record.style),
    primaryColor: normalizeHexColor(record.primaryColor, DEFAULT_PRIMARY),
    secondaryColor: normalizeHexColor(record.secondaryColor, DEFAULT_SECONDARY),
    accentColor: normalizeHexColor(record.accentColor, DEFAULT_ACCENT),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
  };
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
