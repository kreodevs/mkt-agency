import type { BrandVisualStyle } from '../../product/domain/brand-visual-kit.metadata.util';
import type { ResolvedVisualBrandKit } from './visual-brand-kit.util';

export interface ExpandedVisualPalette {
  primary: string;
  secondary: string;
  accent: string;
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  accentSoft: string;
  glow: string;
  surface: string;
  panel: string;
  gradientStops: [string, string, string, string];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return { r: 20, g: 20, b: 19 };
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mixHex(colorA: string, colorB: string, ratio: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const t = clamp(ratio, 0, 1);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

export function lightenHex(hex: string, amount: number): string {
  return mixHex(hex, '#ffffff', clamp(amount, 0, 1));
}

export function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, '#000000', clamp(amount, 0, 1));
}

export function expandVisualPalette(kit: ResolvedVisualBrandKit): ExpandedVisualPalette {
  const primary = kit.primaryColor;
  const secondary = kit.secondaryColor;
  const accent = kit.accentColor;

  return {
    primary,
    secondary,
    accent,
    primaryLight: lightenHex(primary, kit.style === 'luxury' ? 0.22 : 0.34),
    primaryDark: darkenHex(primary, 0.28),
    secondaryLight: lightenHex(secondary, 0.14),
    accentSoft: mixHex(accent, primary, 0.22),
    glow: mixHex(primary, accent, 0.45),
    surface: mixHex(secondary, '#ffffff', kit.style === 'minimal' ? 0.06 : 0.1),
    panel: mixHex(secondary, primary, 0.18),
    gradientStops: [
      darkenHex(secondary, 0.08),
      mixHex(secondary, primary, 0.35),
      mixHex(primary, accent, 0.25),
      mixHex(accent, secondary, 0.4),
    ],
  };
}

function slideTheme(
  slideIndex: number,
  slideCount: number,
  palette: ExpandedVisualPalette,
): {
  base: string;
  glowA: string;
  glowB: string;
  panel: string;
  accentLine: string;
} {
  if (slideCount <= 1) {
    return {
      base: palette.gradientStops[0],
      glowA: palette.glow,
      glowB: palette.primaryLight,
      panel: palette.panel,
      accentLine: palette.accent,
    };
  }

  if (slideIndex === 0) {
    return {
      base: palette.gradientStops[0],
      glowA: palette.primary,
      glowB: palette.accentSoft,
      panel: palette.panel,
      accentLine: palette.accent,
    };
  }

  if (slideIndex === slideCount - 1) {
    return {
      base: mixHex(palette.secondary, palette.primaryDark, 0.35),
      glowA: palette.accent,
      glowB: palette.primaryLight,
      panel: mixHex(palette.primaryDark, palette.secondary, 0.5),
      accentLine: palette.accentSoft,
    };
  }

  return {
    base: mixHex(palette.secondary, palette.primary, 0.28),
    glowA: palette.primaryLight,
    glowB: palette.accent,
    panel: mixHex(palette.secondary, palette.surface, 0.55),
    accentLine: palette.primaryLight,
  };
}

export function buildRichBackgroundSvg(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slideIndex = 0,
  slideCount = 1,
): string {
  const palette = expandVisualPalette(kit);
  const theme = slideTheme(slideIndex, slideCount, palette);
  const angle = kit.style === 'luxury' ? 155 : kit.style === 'bold' ? 125 : 140;
  const glowSize = Math.round(Math.max(width, height) * 0.72);

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgBase" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${theme.base}" />
        <stop offset="48%" stop-color="${palette.gradientStops[1]}" />
        <stop offset="100%" stop-color="${palette.gradientStops[2]}" />
      </linearGradient>
      <radialGradient id="glowA" cx="82%" cy="18%" r="58%">
        <stop offset="0%" stop-color="${theme.glowA}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${theme.glowA}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="12%" cy="88%" r="62%">
        <stop offset="0%" stop-color="${theme.glowB}" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="${theme.glowB}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="accentBand" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${theme.accentLine}" stop-opacity="0"/>
        <stop offset="35%" stop-color="${theme.accentLine}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${theme.accentLine}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgBase)" />
    <rect width="100%" height="100%" fill="url(#glowA)" />
    <rect width="100%" height="100%" fill="url(#glowB)" />
    <rect x="0" y="${Math.round(height * 0.18)}" width="${width}" height="6" fill="url(#accentBand)" opacity="0.65"/>
    <circle cx="${Math.round(width * 0.9)}" cy="${Math.round(height * 0.12)}" r="${Math.round(glowSize * 0.12)}" fill="${palette.accentSoft}" opacity="0.12"/>
    <circle cx="${Math.round(width * 0.08)}" cy="${Math.round(height * 0.78)}" r="${Math.round(glowSize * 0.16)}" fill="${palette.primaryLight}" opacity="0.1"/>
  </svg>`;
}

export function buildDecorativeOverlaySvg(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slideIndex = 0,
): string {
  const palette = expandVisualPalette(kit);
  const dotSpacing = 28;
  const dots: string[] = [];
  for (let y = dotSpacing; y < height; y += dotSpacing) {
    for (let x = dotSpacing; x < width; x += dotSpacing) {
      dots.push(`<circle cx="${x}" cy="${y}" r="1.2" fill="${palette.accentSoft}" opacity="0.08"/>`);
    }
  }

  const accentArc =
    kit.style === 'bold'
      ? `<path d="M ${Math.round(width * 0.62)} ${Math.round(height * 0.08)} Q ${Math.round(width * 0.95)} ${Math.round(height * 0.22)} ${Math.round(width * 0.88)} ${Math.round(height * 0.42)}" stroke="${palette.accent}" stroke-width="3" fill="none" opacity="0.35"/>`
      : kit.style === 'luxury'
        ? `<line x1="${Math.round(width * 0.08)}" y1="${Math.round(height * 0.92)}" x2="${Math.round(width * 0.42)}" y2="${Math.round(height * 0.92)}" stroke="${palette.accent}" stroke-width="1.5" opacity="0.5"/>`
        : '';

  const slideMarker =
    slideIndex > 0
      ? `<rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.06)}" width="42" height="4" rx="2" fill="${palette.primaryLight}" opacity="0.55"/>`
      : '';

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${dots.join('')}
    ${accentArc}
    ${slideMarker}
  </svg>`;
}

export function resolvePanelColor(
  kit: ResolvedVisualBrandKit,
  slideIndex: number,
  slideCount: number,
): string {
  const palette = expandVisualPalette(kit);
  return slideTheme(slideIndex, slideCount, palette).panel;
}

export function styleDesignCue(style: BrandVisualStyle): string {
  switch (style) {
    case 'bold':
      return 'bloques de color, alto contraste, formas geométricas y CTA dominante';
    case 'luxury':
      return 'espacios amplios, acentos sutiles, elegancia premium y tipografía refinada';
    default:
      return 'claridad, jerarquía tipográfica fuerte y acentos luminosos sobre fondo profundo';
  }
}
