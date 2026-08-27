import type { BrandVisualKit, BrandVisualStyle } from '@/types/product';

const HEX_6 = /^#[0-9a-fA-F]{6}$/;
const HEX_3 = /^#[0-9a-fA-F]{3}$/;
const HEX_6_NO_HASH = /^[0-9a-fA-F]{6}$/;
const HEX_3_NO_HASH = /^[0-9a-fA-F]{3}$/;

const DEFAULT_FONT_FAMILY = '"Helvetica Neue", Arial, sans-serif';

export interface BrandStylePreviewPresentation {
  gradientAngle: number;
  gradientMidStop: number;
  postPadding: string;
  postBorderRadius: string;
  postBorderLeft: string | undefined;
  headlineFontFamily: string;
  headlineFontWeight: number;
  headlineLetterSpacing: string;
  ctaBorderRadius: string;
  ctaFontWeight: number;
  ctaTextTransform: 'none' | 'uppercase';
  styleLabel: string;
  showAccentStripe: boolean;
}

export function normalizeBrandFontFamily(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9 ,'"-]/g, '').slice(0, 120);
  return sanitized || DEFAULT_FONT_FAMILY;
}

export function resolvePreviewFontFamily(
  fontFamily: string | null | undefined,
  style: BrandVisualStyle,
): string {
  if (fontFamily?.trim()) {
    return normalizeBrandFontFamily(fontFamily);
  }
  if (style === 'luxury') {
    return 'Georgia, "Times New Roman", serif';
  }
  return DEFAULT_FONT_FAMILY;
}

export function getStylePreviewPresentation(
  style: BrandVisualStyle,
  fontFamily?: string | null,
): BrandStylePreviewPresentation {
  const headlineFontFamily = resolvePreviewFontFamily(fontFamily, style);

  switch (style) {
    case 'bold':
      return {
        gradientAngle: 120,
        gradientMidStop: 42,
        postPadding: '1rem',
        postBorderRadius: '0.375rem',
        postBorderLeft: undefined,
        headlineFontFamily,
        headlineFontWeight: 800,
        headlineLetterSpacing: '-0.02em',
        ctaBorderRadius: '0.25rem',
        ctaFontWeight: 800,
        ctaTextTransform: 'uppercase',
        styleLabel: 'Bold — alto contraste',
        showAccentStripe: true,
      };
    case 'luxury':
      return {
        gradientAngle: 160,
        gradientMidStop: 52,
        postPadding: '1.5rem',
        postBorderRadius: '1rem',
        postBorderLeft: undefined,
        headlineFontFamily,
        headlineFontWeight: 500,
        headlineLetterSpacing: '0.05em',
        ctaBorderRadius: '9999px',
        ctaFontWeight: 600,
        ctaTextTransform: 'none',
        styleLabel: 'Luxury — premium y espacioso',
        showAccentStripe: false,
      };
    default:
      return {
        gradientAngle: 135,
        gradientMidStop: 55,
        postPadding: '1rem',
        postBorderRadius: '0.5rem',
        postBorderLeft: undefined,
        headlineFontFamily,
        headlineFontWeight: 600,
        headlineLetterSpacing: '0',
        ctaBorderRadius: '9999px',
        ctaFontWeight: 600,
        ctaTextTransform: 'none',
        styleLabel: 'Minimal — limpio y legible',
        showAccentStripe: false,
      };
  }
}

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
  presentation?: Pick<BrandStylePreviewPresentation, 'gradientAngle' | 'gradientMidStop'>,
): string {
  const primary = normalizeHexColor(kit.primaryColor, fallback.primaryColor);
  const secondary = normalizeHexColor(kit.secondaryColor, fallback.secondaryColor);
  const accent = normalizeHexColor(kit.accentColor, fallback.accentColor);
  const angle = presentation?.gradientAngle ?? (kit.style === 'luxury' ? 160 : 135);
  const midStop = presentation?.gradientMidStop ?? 55;
  return `linear-gradient(${angle}deg, ${primary} 0%, ${secondary} ${midStop}%, ${accent} 100%)`;
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
