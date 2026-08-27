import type { BrandVisualKit, BrandVisualStyle } from '@/types/product';

const HEX_6 = /^#[0-9a-fA-F]{6}$/;
const HEX_3 = /^#[0-9a-fA-F]{3}$/;
const HEX_6_NO_HASH = /^[0-9a-fA-F]{6}$/;
const HEX_3_NO_HASH = /^[0-9a-fA-F]{3}$/;

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (HEX_6.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (HEX_3.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  if (HEX_6_NO_HASH.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  if (HEX_3_NO_HASH.test(trimmed)) {
    return `#${trimmed[0]}${trimmed[0]}${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}`.toLowerCase();
  }
  return fallback;
}

export function isValidHexColor(value: string): boolean {
  const trimmed = value.trim();
  return (
    HEX_6.test(trimmed) ||
    HEX_3.test(trimmed) ||
    HEX_6_NO_HASH.test(trimmed) ||
    HEX_3_NO_HASH.test(trimmed)
  );
}

export function hexForColorInput(value: string, fallback: string): string {
  return normalizeHexColor(value, fallback);
}

export function buildBrandGradient(
  kit: Pick<BrandVisualKit, 'style' | 'primaryColor' | 'secondaryColor' | 'accentColor'>,
  fallback: Pick<BrandVisualKit, 'primaryColor' | 'secondaryColor' | 'accentColor'>,
): string {
  const primary = normalizeHexColor(kit.primaryColor, fallback.primaryColor);
  const secondary = normalizeHexColor(kit.secondaryColor, fallback.secondaryColor);
  const accent = normalizeHexColor(kit.accentColor, fallback.accentColor);
  const angle = kit.style === 'luxury' ? 160 : 135;
  return `linear-gradient(${angle}deg, ${primary} 0%, ${secondary} 55%, ${accent} 100%)`;
}

export function relativeLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex, '#000000').slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrastingTextColor(backgroundHex: string): string {
  return relativeLuminance(backgroundHex) > 0.45 ? '#0f1419' : '#faf8f5';
}

export const DEFAULT_BRAND_COLORS = {
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#dbeafe',
} as const;

export function resolvePreviewKit(
  draft: Pick<BrandVisualKit, 'style' | 'primaryColor' | 'secondaryColor' | 'accentColor'>,
  fallback: Pick<BrandVisualKit, 'primaryColor' | 'secondaryColor' | 'accentColor'> = DEFAULT_BRAND_COLORS,
): Pick<BrandVisualKit, 'style' | 'primaryColor' | 'secondaryColor' | 'accentColor'> {
  return {
    style: draft.style,
    primaryColor: normalizeHexColor(draft.primaryColor, fallback.primaryColor),
    secondaryColor: normalizeHexColor(draft.secondaryColor, fallback.secondaryColor),
    accentColor: normalizeHexColor(draft.accentColor, fallback.accentColor),
  };
}
