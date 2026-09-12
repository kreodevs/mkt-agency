import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import type { AssetDeviceHint } from '../../assets/domain/asset-folder.util';
import {
  normalizeBrandFontFamily,
  stripCssFontQuotes,
} from '../../product/domain/brand-visual-kit.metadata.util';
import {
  buildDeviceShadow,
  renderDeviceFrame,
  renderMiniDeviceThumbnail,
  resolveDeviceFrameType,
  resolveDevicePlacement,
  resolveHeroDevicePlacement,
  resolveVisualAspectRatio,
  type VisualAspectRatio,
} from './device-frame-render.util';
import { resizeScreenshotContain, resizeScreenshotForSlot } from './screenshot-crop.util';
import {
  buildDecorativeOverlaySvg,
  buildRichBackgroundSvg,
  resolvePanelColor,
} from './visual-palette-expand.util';
import type { ResolvedVisualBrandKit } from './visual-brand-kit.util';
import type { VisualTemplateId } from './visual-template.constants';

export interface VisualTemplateSlots {
  headline: string;
  subline?: string;
  cta?: string;
  statValue?: string;
  statLabel?: string;
}

export interface RenderVisualTemplateInput {
  templateId: VisualTemplateId;
  brandKit: ResolvedVisualBrandKit;
  slots: VisualTemplateSlots;
  size: ImageGenerationSize;
  platform?: string | null;
  slideIndex?: number;
  slideCount?: number;
  photoBuffer?: Buffer | null;
  logoBuffer?: Buffer | null;
  logoMimeType?: string | null;
  screenshotDevice?: AssetDeviceHint | null;
  /** Retrato de CM virtual para portadas con presentadora. */
  cmPortraitBuffer?: Buffer | null;
}

export interface VisualLayoutContext {
  platform?: string | null;
  aspectRatio: VisualAspectRatio;
  screenshotDevice?: AssetDeviceHint | null;
}

export type VisualLayoutMode =
  | 'gradient-only'
  | 'gradient-hook'
  | 'cta-solid'
  | 'split-screenshot-top'
  | 'device-mockup'
  | 'story-bleed'
  | 'stat-solid'
  | 'quote-editorial'
  | 'carousel-cover'
  | 'carousel-step'
  | 'carousel-cta';

const TEXT_PRIMARY = '#faf9f5';
const TEXT_MUTED = '#e8e6df';

function resolveTextFonts(
  kit: ResolvedVisualBrandKit,
  isQuote: boolean,
): { sans: string; display: string } {
  if (kit.fontFamily) {
    const brandFont = normalizeBrandFontFamily(kit.fontFamily);
    return { sans: brandFont, display: brandFont };
  }
  if (isQuote || kit.style === 'luxury') {
    return { sans: 'Georgia, serif', display: 'Georgia, serif' };
  }
  const base = 'Helvetica Neue, Arial, sans-serif';
  return { sans: base, display: base };
}

export function parseImageSize(size: ImageGenerationSize): { width: number; height: number } {
  const [widthRaw, heightRaw] = size.split('x');
  return {
    width: Number(widthRaw) || 1080,
    height: Number(heightRaw) || 1080,
  };
}

export function truncateWords(text: string, maxWords: number): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(' ');
  }
  return `${words.slice(0, maxWords).join(' ')}…`;
}

export function summarizeHeadline(
  title: string,
  body: string,
  maxWords = 8,
): string {
  const fromTitle = title.replace(/[#*_`]/g, '').trim();
  if (fromTitle && fromTitle.length <= 60) {
    return truncateWords(fromTitle, maxWords);
  }
  const firstSentence = body.split(/[.!?]/)[0]?.trim() ?? body;
  return truncateWords(firstSentence, maxWords);
}

export function extractStatFromBody(body: string): { statValue: string; statLabel: string } | null {
  const match = body.match(/(\d+[%+]?)\s*([^\n.!?]{3,40})/);
  if (!match) {
    return null;
  }
  return {
    statValue: match[1],
    statLabel: truncateWords(match[2].trim(), 6),
  };
}

export function splitCarouselTips(body: string, count = 3): string[] {
  const lines = body
    .split(/\n+/)
    .map((line) => line.replace(/^[\d\-•*]+\s*/, '').trim())
    .filter(Boolean);

  if (lines.length >= count) {
    return lines.slice(0, count);
  }

  const sentences = body
    .split(/[.!?]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 12);

  if (sentences.length >= count) {
    return sentences.slice(0, count);
  }

  const base = summarizeHeadline('', body, 10);
  return Array.from({ length: count }, (_, index) => {
    if (sentences[index]) {
      return truncateWords(sentences[index], 12);
    }
    return `${base} (${index + 1}/${count})`;
  });
}

export function buildVisualTemplateSlots(
  post: {
    title: string;
    body: string;
    callToAction: string;
    visualHeadline?: string;
    visualSubline?: string;
    visualCta?: string;
  },
  templateId: VisualTemplateId,
  slideIndex = 0,
  slideCount = 1,
): VisualTemplateSlots {
  const cta = post.visualCta?.trim() || truncateWords(post.callToAction, 4);

  if (slideCount > 1) {
    const tips = splitCarouselTips(post.body, slideCount);
    if (slideIndex === 0) {
      return {
        headline:
          post.visualHeadline?.trim() ||
          summarizeHeadline(post.title, post.body, templateId === 'stat-highlight' ? 4 : 8),
        subline:
          post.visualSubline?.trim() || truncateWords(tips[0] ?? post.body, 12),
        cta,
      };
    }

    if (slideIndex === slideCount - 1) {
      const closingTip = tips[slideIndex] ?? post.callToAction;
      return {
        headline: cta || truncateWords(post.callToAction, 4) || 'Empieza hoy',
        subline: truncateWords(closingTip, 12),
        cta,
      };
    }

    const tip = tips[slideIndex] ?? `Paso ${slideIndex + 1}`;
    return {
      headline: truncateWords(tip, 8),
      subline: truncateWords(tip, 14),
      cta,
    };
  }

  const headline =
    post.visualHeadline?.trim() ||
    summarizeHeadline(post.title, post.body, templateId === 'stat-highlight' ? 4 : 8);

  const subline =
    post.visualSubline?.trim() ||
    (templateId === 'quote-insight'
      ? truncateWords(post.body, 18)
      : truncateWords(post.body, 12));

  if (templateId === 'stat-highlight') {
    const stat = extractStatFromBody(post.body);
    if (stat) {
      return {
        headline: post.visualHeadline?.trim() || stat.statLabel,
        statValue: stat.statValue,
        statLabel: stat.statLabel,
        cta,
      };
    }
  }

  return { headline, subline, cta };
}

/** Elige composición según plantilla, plataforma, aspecto y slide de carrusel. */
export function resolveVisualLayoutMode(
  templateId: VisualTemplateId,
  slideIndex: number,
  slideCount: number,
  hasPhoto: boolean,
  layoutContext?: VisualLayoutContext,
): VisualLayoutMode {
  const aspect = layoutContext?.aspectRatio ?? 'square';
  const platform = layoutContext?.platform;

  if (!hasPhoto) {
    return 'gradient-only';
  }

  if (slideCount > 1) {
    if (!hasPhoto) {
      if (slideIndex === 0) {
        return 'gradient-hook';
      }
      if (slideIndex === slideCount - 1) {
        return 'cta-solid';
      }
      return 'gradient-only';
    }

    if (slideIndex === 0) {
      return 'carousel-cover';
    }
    if (slideIndex === slideCount - 1) {
      return 'carousel-cta';
    }
    return 'carousel-step';
  }

  if (hasPhoto) {
    return 'carousel-cover';
  }

  switch (templateId) {
    case 'product-hero':
      if (aspect === 'vertical' || platform === 'instagram' || platform === 'tiktok') {
        return 'device-mockup';
      }
      if (platform === 'linkedin' || platform === 'twitter') {
        return 'device-mockup';
      }
      return aspect === 'square' ? 'split-screenshot-top' : 'device-mockup';
    case 'tip-card':
    case 'promo-cta':
      return 'device-mockup';
    case 'quote-insight':
      return 'gradient-only';
    case 'stat-highlight':
      return 'stat-solid';
    case 'story-vertical':
      return aspect === 'vertical' ? 'story-bleed' : 'device-mockup';
    default:
      return aspect === 'vertical' ? 'story-bleed' : 'split-screenshot-top';
  }
}

export function resolveSplitPhotoRatio(aspectRatio: VisualAspectRatio): number {
  return aspectRatio === 'vertical' ? 0.48 : 0.52;
}

export function resolveStoryPhotoRatio(aspectRatio: VisualAspectRatio): number {
  return aspectRatio === 'vertical' ? 0.64 : 0.58;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Atributo font-family seguro para SVG (evita comillas dobles anidadas que rompen librsvg). */
function svgFontFamily(fontStack: string): string {
  return `font-family='${escapeXml(stripCssFontQuotes(fontStack))}'`;
}

function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

function buildGradientSvg(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slideIndex = 0,
  slideCount = 1,
): string {
  return buildRichBackgroundSvg(width, height, kit, slideIndex, slideCount);
}

function buildSolidSvg(width: number, height: number, color: string): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
  </svg>`;
}

interface TextBlockOptions {
  width: number;
  height: number;
  kit: ResolvedVisualBrandKit;
  slots: VisualTemplateSlots;
  templateId: VisualTemplateId;
  slideIndex: number;
  slideCount: number;
  variant: VisualLayoutMode;
  backgroundColor?: string;
}

function buildTextBlockSvg(options: TextBlockOptions): string {
  const {
    width,
    height,
    kit,
    slots,
    templateId,
    slideIndex,
    slideCount,
    variant,
    backgroundColor,
  } = options;

  const padding = Math.round(width * 0.08);
  const isCtaFocus = variant === 'cta-solid';
  const isStat = variant === 'stat-solid' || templateId === 'stat-highlight';
  const isQuote = variant === 'quote-editorial' || templateId === 'quote-insight';
  const isHook = variant === 'gradient-hook';
  const fonts = resolveTextFonts(kit, isQuote);

  const headlineSize = isStat
    ? Math.round(width * 0.11)
    : isCtaFocus
      ? Math.round(width * 0.065)
      : isHook
        ? Math.round(width * 0.085)
        : Math.round(width * 0.068);
  const sublineSize = Math.round(headlineSize * 0.44);
  const ctaSize = Math.round(headlineSize * 0.42);
  const statSize = Math.round(width * 0.2);

  const headlineLines = wrapTextLines(
    slots.headline,
    isQuote ? 22 : 18,
    isQuote ? 4 : isHook ? 3 : 2,
  );
  const sublineLines = wrapTextLines(
    slots.subline ?? '',
    30,
    variant === 'split-screenshot-top' ? 4 : 3,
  );

  const panelFill = backgroundColor ?? kit.secondaryColor;
  const showPanel = variant === 'split-screenshot-top' || variant === 'story-bleed' || variant === 'cta-solid';

  let contentY =
    variant === 'story-bleed'
      ? padding
      : isCtaFocus
        ? Math.round(height * 0.22)
        : isStat
          ? Math.round(height * 0.18)
          : isHook
            ? Math.round(height * 0.32)
            : padding + Math.round(headlineSize * 0.4);

  const headlineTspans = headlineLines
    .map((line, index) => {
      const dy = index === 0 ? 0 : headlineSize * 1.12;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const sublineTspans = sublineLines
    .map((line, index) => {
      const dy = index === 0 ? sublineSize * 1.35 : sublineSize * 1.2;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const slideBadge =
    slideCount > 1
      ? `<text x="${width - padding}" y="${padding + 26}" text-anchor="end" fill="${TEXT_MUTED}" ${svgFontFamily(fonts.sans)} font-size="20" font-weight="600" opacity="0.9">${slideIndex + 1}/${slideCount}</text>`
      : '';

  const promoBadge =
    templateId === 'promo-cta' && variant !== 'cta-solid'
      ? `<rect x="${padding}" y="${padding}" rx="16" ry="16" width="${Math.min(width * 0.28, 200)}" height="44" fill="${kit.accentColor}"/>
         <text x="${padding + 18}" y="${padding + 30}" fill="${kit.secondaryColor}" ${svgFontFamily(fonts.sans)} font-size="18" font-weight="700">NUEVO</text>`
      : '';

  const ctaY = isCtaFocus
    ? Math.round(height * 0.58)
    : height - padding - 56;
  const ctaWidth = Math.min(width - padding * 2, isCtaFocus ? 480 : 380);

  const ctaBlock = slots.cta
    ? `<rect x="${padding}" y="${ctaY}" rx="28" ry="28" width="${ctaWidth}" height="56" fill="${kit.primaryColor}"/>
       <text x="${padding + 28}" y="${ctaY + 36}" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.sans)} font-size="${ctaSize}" font-weight="700">${escapeXml(slots.cta)}</text>`
    : '';

  const statBlock =
    isStat && slots.statValue
      ? `<text x="${padding}" y="${contentY}" fill="${kit.accentColor}" ${svgFontFamily(fonts.sans)} font-size="${statSize}" font-weight="800" letter-spacing="-2">${escapeXml(slots.statValue)}</text>`
      : '';

  const headlineFont = isQuote ? fonts.display : fonts.display;
  const headlineY = statBlock ? contentY + statSize * 0.95 : contentY;
  const headlineBlock = statBlock
    ? `<text x="${padding}" y="${headlineY}" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.sans)} font-size="${Math.round(headlineSize * 0.72)}" font-weight="600">${headlineTspans}</text>`
    : `<text x="${padding}" y="${headlineY}" fill="${TEXT_PRIMARY}" ${svgFontFamily(headlineFont)} font-size="${headlineSize}" font-weight="700">${headlineTspans}</text>`;

  const sublineY =
    headlineY +
    headlineSize * (headlineLines.length + (statBlock ? 0.35 : 0.55));

  const panelRect = showPanel
    ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${panelFill}" />`
    : '';

  const quoteMark =
    isQuote && variant === 'quote-editorial'
      ? `<text x="${padding - 4}" y="${contentY - 8}" fill="${kit.accentColor}" font-family="Georgia, serif" font-size="${Math.round(headlineSize * 1.6)}" font-weight="700" opacity="0.35">"</text>`
      : '';

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${panelRect}
    ${slideBadge}
    ${promoBadge}
    ${quoteMark}
    ${statBlock}
    ${statBlock ? '' : headlineBlock}
    <text x="${padding}" y="${sublineY}" fill="${TEXT_MUTED}" ${svgFontFamily(fonts.sans)} font-size="${sublineSize}" font-weight="400">${sublineTspans}</text>
    ${ctaBlock}
  </svg>`;
}

async function applyRoundedCorners(
  input: Buffer,
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );
  return sharp(input).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function renderGradientBase(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slideIndex = 0,
  slideCount = 1,
): Promise<Buffer> {
  const bgSvg = Buffer.from(buildGradientSvg(width, height, kit, slideIndex, slideCount));
  const decorSvg = Buffer.from(buildDecorativeOverlaySvg(width, height, kit, slideIndex));
  return sharp(bgSvg).composite([{ input: decorSvg, top: 0, left: 0 }]).png().toBuffer();
}

const CM_PORTRAIT_RING_PADDING = 12;

function cmPortraitBadgeOuterSize(diameter: number): number {
  return diameter + CM_PORTRAIT_RING_PADDING;
}

function resolveCmPortraitPlacement(
  width: number,
  height: number,
  badgeOuterSize: number,
  devicePlacement: { top: number; frameHeight: number; left: number },
  scrimTop: number,
): { top: number; left: number } {
  const padding = Math.round(width * 0.08);
  const topSafe = Math.round(height * 0.22);
  const deviceCenterY = devicePlacement.top + devicePlacement.frameHeight / 2;
  let top = Math.round(deviceCenterY - badgeOuterSize / 2);
  const maxBottom = scrimTop - padding;
  if (top + badgeOuterSize > maxBottom) {
    top = maxBottom - badgeOuterSize;
  }
  top = Math.max(topSafe, top);
  const maxLeft = devicePlacement.left - badgeOuterSize - Math.round(padding * 0.75);
  const left = Math.max(padding, Math.min(maxLeft, Math.round(width * 0.1)));
  return { left, top };
}

function applyPresenterDevicePlacement(
  placement: { left: number; top: number; frameWidth: number; frameHeight: number },
  canvasWidth: number,
  canvasHeight: number,
): void {
  const maxPhoneW = Math.round(canvasWidth * 0.52);
  if (placement.frameWidth > maxPhoneW) {
    const scale = maxPhoneW / placement.frameWidth;
    placement.frameWidth = maxPhoneW;
    placement.frameHeight = Math.round(placement.frameHeight * scale);
  }
  placement.left = canvasWidth - placement.frameWidth - Math.round(canvasWidth * 0.06);
  placement.top = Math.round(canvasHeight * 0.05);
}

async function renderCmPortraitBadge(
  portraitBuffer: Buffer,
  diameter: number,
): Promise<Buffer> {
  const outer = cmPortraitBadgeOuterSize(diameter);
  const ringInset = Math.round(CM_PORTRAIT_RING_PADDING / 2);

  const face = await sharp(portraitBuffer)
    .resize(diameter, diameter, { fit: 'cover', position: 'north' })
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${diameter}" height="${diameter}"><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" fill="white"/></svg>`,
  );

  const circularFace = await sharp(face)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const ring = Buffer.from(
    `<svg width="${outer}" height="${outer}">
      <circle cx="${outer / 2}" cy="${outer / 2}" r="${diameter / 2 + 4}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
    </svg>`,
  );

  return sharp({
    create: {
      width: outer,
      height: outer,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: ring, top: 0, left: 0 },
      { input: circularFace, top: ringInset, left: ringInset },
    ])
    .png()
    .toBuffer();
}

type CarouselTextMode = 'cover' | 'step' | 'cta';

function buildCarouselTextSvg(options: {
  width: number;
  height: number;
  kit: ResolvedVisualBrandKit;
  slots: VisualTemplateSlots;
  slideIndex: number;
  slideCount: number;
  mode: CarouselTextMode;
}): string {
  const { width, height, kit, slots, slideIndex, slideCount, mode } = options;
  const padding = Math.round(width * 0.08);
  const fonts = resolveTextFonts(kit, false);
  const headlineSize = Math.round(width * (mode === 'cta' ? 0.064 : 0.074));
  const sublineSize = Math.round(headlineSize * 0.4);
  const headlineLines = wrapTextLines(slots.headline, 18, 2);
  const sublineLines = wrapTextLines(slots.subline ?? '', mode === 'cover' ? 26 : 32, 2);

  const headlineTspans = headlineLines
    .map((line, index) => {
      const dy = index === 0 ? 0 : headlineSize * 1.1;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const sublineTspans = sublineLines
    .map((line, index) => {
      const dy = index === 0 ? 0 : sublineSize * 1.2;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const slideBadge =
    slideCount > 1
      ? `<rect x="${width - padding - 54}" y="${padding}" rx="14" ry="14" width="54" height="28" fill="rgba(255,255,255,0.14)"/>
         <text x="${width - padding - 27}" y="${padding + 19}" text-anchor="middle" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.sans)} font-size="14" font-weight="700">${slideIndex + 1}/${slideCount}</text>`
      : '';

  if (mode === 'cover') {
    const ctaH = 54;
    const ctaW = Math.min(width - padding * 2, 420);
    const blockGap = Math.round(sublineSize * 1.25);
    const headlineLineGap = headlineSize * 1.12;
    const sublineLineGap = sublineSize * 1.2;
    const hasCta = Boolean(slots.cta?.trim());
    const hasSubline = sublineLines.length > 0 && Boolean(slots.subline?.trim());

    const ctaY = hasCta ? height - padding - ctaH : height - padding;
    let anchorBaseline = hasCta ? ctaY - blockGap : height - padding;

    const sublineLastBaseline = anchorBaseline;
    const sublineFirstBaseline = hasSubline
      ? sublineLastBaseline - (sublineLines.length - 1) * sublineLineGap
      : anchorBaseline;
    anchorBaseline = hasSubline ? sublineFirstBaseline - blockGap : anchorBaseline;

    const headlineLastBaseline = anchorBaseline;
    const headlineFirstBaseline =
      headlineLastBaseline - (headlineLines.length - 1) * headlineLineGap;
    const minHeadlineBaseline = Math.round(height * 0.54) + Math.round(headlineSize * 0.2);
    const headlineY = Math.max(headlineFirstBaseline, minHeadlineBaseline);

    const ctaTextColor =
      kit.accentColor.toLowerCase() === kit.secondaryColor.toLowerCase() ? TEXT_PRIMARY : kit.secondaryColor;
    const ctaBlock = hasCta
      ? `<rect x="${padding}" y="${ctaY}" rx="30" ry="30" width="${ctaW}" height="${ctaH}" fill="${kit.accentColor}"/>
         <text x="${padding + 26}" y="${ctaY + 36}" fill="${ctaTextColor}" ${svgFontFamily(fonts.sans)} font-size="${Math.round(headlineSize * 0.38)}" font-weight="800">${escapeXml(slots.cta!)}</text>`
      : '';

    const sublineBlock = hasSubline
      ? `<text x="${padding}" y="${sublineFirstBaseline}" fill="${TEXT_MUTED}" ${svgFontFamily(fonts.sans)} font-size="${sublineSize}" font-weight="400">${sublineTspans}</text>`
      : '';

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${slideBadge}
      <text x="${padding}" y="${headlineY}" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.display)} font-size="${headlineSize}" font-weight="800">${headlineTspans}</text>
      ${sublineBlock}
      ${ctaBlock}
    </svg>`;
  }

  const stepBadge =
    mode === 'step'
      ? `<circle cx="${padding + 24}" cy="${padding + 26}" r="22" fill="${kit.accentColor}"/>
         <text x="${padding + 24}" y="${padding + 32}" text-anchor="middle" fill="${kit.secondaryColor}" ${svgFontFamily(fonts.sans)} font-size="18" font-weight="800">${slideIndex + 1}</text>`
      : '';

  const headlineY = mode === 'cta' ? padding + 12 : padding + 58;
  const sublineY = headlineY + headlineSize * (headlineLines.length + 0.45);
  const ctaBtnH = 58;
  const ctaBtnY = height - padding - ctaBtnH;
  const ctaBtnW = width - padding * 2;
  const ctaBlock = slots.cta
    ? `<rect x="${padding}" y="${ctaBtnY}" rx="30" ry="30" width="${ctaBtnW}" height="${ctaBtnH}" fill="${kit.accentColor}"/>
       <text x="${padding + 28}" y="${ctaBtnY + 38}" fill="${kit.secondaryColor}" ${svgFontFamily(fonts.sans)} font-size="${Math.round(headlineSize * 0.42)}" font-weight="800">${escapeXml(slots.cta)}</text>`
    : '';

  const headlineBlock =
    mode === 'cta'
      ? `<text x="${padding}" y="${headlineY + headlineSize * 0.85}" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.display)} font-size="${Math.round(headlineSize * 0.92)}" font-weight="800">${headlineTspans}</text>`
      : `<text x="${padding + (mode === 'step' ? 56 : 0)}" y="${headlineY}" fill="${TEXT_PRIMARY}" ${svgFontFamily(fonts.display)} font-size="${headlineSize}" font-weight="800">${headlineTspans}</text>`;

  const sublineBlock =
    sublineLines.length > 0 && slots.subline?.trim()
      ? `<text x="${padding + (mode === 'step' ? 56 : 0)}" y="${sublineY}" fill="${TEXT_MUTED}" ${svgFontFamily(fonts.sans)} font-size="${sublineSize}" font-weight="400">${sublineTspans}</text>`
      : '';

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${stepBadge}
    ${headlineBlock}
    ${sublineBlock}
    ${mode === 'cta' ? ctaBlock : ''}
  </svg>`;
}

function buildBottomScrimSvg(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="45%" stop-color="#000000" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#scrim)"/>
  </svg>`;
}

async function renderCarouselVisualAsset(
  photoBuffer: Buffer,
  width: number,
  zoneHeight: number,
  layoutContext: VisualLayoutContext,
): Promise<{ buffer: Buffer; left: number; top: number }> {
  const frameType = resolveDeviceFrameType(
    layoutContext.platform,
    layoutContext.aspectRatio,
    layoutContext.screenshotDevice,
  );

  if (frameType === 'iphone' || frameType === 'ipad') {
    const placement = resolveHeroDevicePlacement(
      width,
      zoneHeight,
      frameType,
      layoutContext.aspectRatio,
    );
    const deviceImage = await renderDeviceFrame(photoBuffer, placement);
    return { buffer: deviceImage, left: placement.left, top: placement.top };
  }

  const visualW = Math.round(width * 0.88);
  const visualH = Math.round(zoneHeight * 0.84);
  const visualLeft = Math.round((width - visualW) / 2);
  const visualTop = Math.round(zoneHeight * 0.05);
  let visualBuffer = await resizeScreenshotContain(photoBuffer, visualW, visualH, {
    r: 248,
    g: 250,
    b: 252,
    alpha: 255,
  });
  visualBuffer = await applyRoundedCorners(visualBuffer, visualW, visualH, 18);
  return { buffer: visualBuffer, left: visualLeft, top: visualTop };
}

async function renderCarouselCover(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
  cmPortraitBuffer?: Buffer | null,
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit, slideIndex, slideCount);
  const frameType = resolveDeviceFrameType(
    layoutContext.platform,
    layoutContext.aspectRatio,
    layoutContext.screenshotDevice,
  );
  const hasPresenter = Boolean(cmPortraitBuffer);
  const placement = resolveHeroDevicePlacement(
    width,
    height,
    frameType,
    layoutContext.aspectRatio,
  );
  if (hasPresenter) {
    applyPresenterDevicePlacement(placement, width, height);
  }
  const deviceImage = await renderDeviceFrame(photoBuffer, placement);
  const shadow = await buildDeviceShadow(
    placement.frameWidth + 32,
    placement.frameHeight + 32,
    Math.round(placement.frameWidth * 0.09),
  );

  const scrimH = Math.round(height * 0.52);
  const scrimSvg = Buffer.from(buildBottomScrimSvg(width, scrimH));
  const textSvg = Buffer.from(
    buildCarouselTextSvg({
      width,
      height,
      kit,
      slots,
      slideIndex,
      slideCount,
      mode: 'cover',
    }),
  );

  const composites: Array<{ input: Buffer; top: number; left: number }> = [
    { input: shadow, top: placement.top + 10, left: placement.left - 16 },
    { input: deviceImage, top: placement.top, left: placement.left },
    { input: scrimSvg, top: height - scrimH, left: 0 },
    { input: textSvg, top: 0, left: 0 },
  ];

  if (cmPortraitBuffer) {
    const portraitSize = Math.round(Math.min(width, height) * 0.27);
    const portrait = await renderCmPortraitBadge(cmPortraitBuffer, portraitSize);
    const scrimTop = height - scrimH;
    const portraitPlacement = resolveCmPortraitPlacement(
      width,
      height,
      cmPortraitBadgeOuterSize(portraitSize),
      {
        top: placement.top,
        frameHeight: placement.frameHeight,
        left: placement.left,
      },
      scrimTop,
    );
    composites.splice(1, 0, {
      input: portrait,
      top: portraitPlacement.top,
      left: portraitPlacement.left,
    });
  }

  return sharp(base).composite(composites).png().toBuffer();
}

async function renderCarouselStep(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const photoZoneH = Math.round(height * 0.58);
  const panelH = height - photoZoneH;
  const topBg = await renderGradientBase(width, photoZoneH, kit, slideIndex, slideCount);
  const visual = await renderCarouselVisualAsset(photoBuffer, width, photoZoneH, layoutContext);
  const textSvg = Buffer.from(
    buildCarouselTextSvg({
      width,
      height: panelH,
      kit,
      slots,
      slideIndex,
      slideCount,
      mode: 'step',
    }),
  );
  const panelColor = resolvePanelColor(kit, slideIndex, slideCount);
  const panel = await sharp(Buffer.from(buildSolidSvg(width, panelH, panelColor)))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: topBg, top: 0, left: 0 },
      { input: visual.buffer, top: visual.top, left: visual.left },
      { input: panel, top: photoZoneH, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderCarouselCta(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const photoZoneH = Math.round(height * 0.5);
  const panelH = height - photoZoneH;
  const topBg = await renderGradientBase(width, photoZoneH, kit, slideIndex, slideCount);
  const visual = await renderCarouselVisualAsset(photoBuffer, width, photoZoneH, layoutContext);
  const textSvg = Buffer.from(
    buildCarouselTextSvg({
      width,
      height: panelH,
      kit,
      slots,
      slideIndex,
      slideCount,
      mode: 'cta',
    }),
  );
  const panelColor = resolvePanelColor(kit, slideIndex, slideCount);
  const panel = await sharp(Buffer.from(buildSolidSvg(width, panelH, panelColor)))
    .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: topBg, top: 0, left: 0 },
      { input: visual.buffer, top: visual.top, left: visual.left },
      { input: panel, top: photoZoneH, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderSplitScreenshotTop(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const photoHeight = Math.round(height * resolveSplitPhotoRatio(layoutContext.aspectRatio));
  const panelHeight = height - photoHeight;
  const fadeHeight = Math.min(56, Math.round(photoHeight * 0.14));

  const screenshot = await resizeScreenshotForSlot(photoBuffer, width, photoHeight, {
    background: { ...hexToRgb(kit.secondaryColor), alpha: 255 },
  });

  const fadeSvg = Buffer.from(
    `<svg width="${width}" height="${fadeHeight}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${kit.secondaryColor}" stop-opacity="0"/>
          <stop offset="100%" stop-color="${kit.secondaryColor}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`,
  );

  const screenshotWithFade = await sharp(screenshot)
    .composite([{ input: fadeSvg, top: photoHeight - fadeHeight, left: 0 }])
    .png()
    .toBuffer();

  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height: panelHeight,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant: 'split-screenshot-top',
      backgroundColor: kit.secondaryColor,
    }),
  );

  const panel = await sharp(Buffer.from(buildSolidSvg(width, panelHeight, kit.secondaryColor)))
    .composite([{ input: textSvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  const bg = hexToRgb(kit.secondaryColor);
  return sharp({
    create: { width, height, channels: 4, background: { ...bg, alpha: 255 } },
  })
    .composite([
      { input: screenshotWithFade, top: 0, left: 0 },
      { input: panel, top: photoHeight, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderDeviceMockup(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const frameType = resolveDeviceFrameType(
    layoutContext.platform,
    layoutContext.aspectRatio,
    layoutContext.screenshotDevice,
  );
  const placement = resolveDevicePlacement(width, height, frameType, layoutContext.aspectRatio);
  const deviceImage = await renderDeviceFrame(photoBuffer, placement);
  const shadow = await buildDeviceShadow(
    placement.frameWidth + 28,
    placement.frameHeight + 28,
    Math.round(placement.frameWidth * 0.08),
  );

  const textAreaTop =
    placement.top + placement.frameHeight + Math.round(height * 0.035);
  const textAreaHeight = height - textAreaTop;
  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height: textAreaHeight,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant: 'device-mockup',
    }),
  );

  return sharp(base)
    .composite([
      { input: shadow, top: placement.top + 8, left: placement.left - 14 },
      { input: deviceImage, top: placement.top, left: placement.left },
      { input: textSvg, top: textAreaTop, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderStoryBleed(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const photoHeight = Math.round(height * resolveStoryPhotoRatio(layoutContext.aspectRatio));
  const panelHeight = height - photoHeight;

  const screenshot = await resizeScreenshotForSlot(photoBuffer, width, photoHeight, {
    background: { ...hexToRgb(kit.secondaryColor), alpha: 255 },
  });

  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height: panelHeight,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant: 'story-bleed',
      backgroundColor: kit.secondaryColor,
    }),
  );

  const panel = await sharp(Buffer.from(buildSolidSvg(width, panelHeight, kit.secondaryColor)))
    .composite([{ input: textSvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  const bg = hexToRgb(kit.secondaryColor);
  return sharp({
    create: { width, height, channels: 4, background: { ...bg, alpha: 255 } },
  })
    .composite([
      { input: screenshot, top: 0, left: 0 },
      { input: panel, top: photoHeight, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderQuoteEditorial(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const thumbW = Math.round(width * 0.34);
  const thumbH = Math.round(height * 0.22);
  const thumbLeft = width - thumbW - Math.round(width * 0.06);
  const thumbTop = Math.round(height * 0.06);

  const thumb = await renderMiniDeviceThumbnail(
    photoBuffer,
    thumbW,
    thumbH,
    layoutContext.platform,
    layoutContext.screenshotDevice,
    layoutContext.aspectRatio,
  );

  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant: 'quote-editorial',
    }),
  );

  const thumbBorder = Buffer.from(
    `<svg width="${thumbW + 4}" height="${thumbH + 4}">
      <rect x="1" y="1" width="${thumbW + 2}" height="${thumbH + 2}" rx="12" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    </svg>`,
  );

  return sharp(base)
    .composite([
      { input: thumb, top: thumbTop, left: thumbLeft },
      { input: thumbBorder, top: thumbTop - 2, left: thumbLeft - 2 },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderStatSolid(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  photoBuffer: Buffer,
  slideIndex: number,
  slideCount: number,
  layoutContext: VisualLayoutContext,
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const thumbW = Math.round(width * 0.28);
  const thumbH = Math.round(height * 0.16);
  const thumbLeft = width - thumbW - Math.round(width * 0.06);
  const thumbTop = Math.round(height * 0.06);

  const thumb = await renderMiniDeviceThumbnail(
    photoBuffer,
    thumbW,
    thumbH,
    layoutContext.platform,
    layoutContext.screenshotDevice,
    layoutContext.aspectRatio,
  );

  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant: 'stat-solid',
    }),
  );

  return sharp(base)
    .composite([
      { input: thumb, top: thumbTop, left: thumbLeft },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderGradientText(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  slideIndex: number,
  slideCount: number,
  variant: VisualLayoutMode,
): Promise<Buffer> {
  const base =
    variant === 'cta-solid'
      ? await sharp(Buffer.from(buildSolidSvg(width, height, kit.primaryColor))).png().toBuffer()
      : await renderGradientBase(width, height, kit);

  const textSvg = Buffer.from(
    buildTextBlockSvg({
      width,
      height,
      kit,
      slots,
      templateId,
      slideIndex,
      slideCount,
      variant,
      backgroundColor: variant === 'cta-solid' ? kit.primaryColor : undefined,
    }),
  );

  return sharp(base).composite([{ input: textSvg, top: 0, left: 0 }]).png().toBuffer();
}

type LogoCorner = 'top-left' | 'top-right';

async function compositeLogo(
  base: Buffer,
  logoBuffer: Buffer,
  mimeType: string | null,
  width: number,
  height: number,
  _corner: LogoCorner = 'top-left',
): Promise<Buffer> {
  const logoWidth = Math.max(88, Math.round(Math.min(width, height) * 0.14));
  const pipeline =
    mimeType === 'image/svg+xml' ? sharp(logoBuffer, { density: 300 }) : sharp(logoBuffer);
  const logo = await pipeline.resize({ width: logoWidth, withoutEnlargement: true }).png().toBuffer();
  const padding = Math.round(Math.min(width, height) * 0.04);
  const left = padding;
  return sharp(base).composite([{ input: logo, top: padding, left }]).png().toBuffer();
}

export async function renderVisualTemplateFrame(
  input: RenderVisualTemplateInput,
): Promise<Buffer> {
  const { width, height } = parseImageSize(input.size);
  const slideIndex = input.slideIndex ?? 0;
  const slideCount = input.slideCount ?? 1;
  const hasPhoto = Boolean(input.photoBuffer);
  const layoutContext: VisualLayoutContext = {
    platform: input.platform,
    aspectRatio: resolveVisualAspectRatio(input.size),
    screenshotDevice: input.screenshotDevice,
  };
  const layout = resolveVisualLayoutMode(
    input.templateId,
    slideIndex,
    slideCount,
    hasPhoto,
    layoutContext,
  );

  let composed: Buffer;

  switch (layout) {
    case 'carousel-cover':
      composed = await renderCarouselCover(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
        input.cmPortraitBuffer,
      );
      break;
    case 'carousel-step':
      composed = await renderCarouselStep(
        width,
        height,
        input.brandKit,
        input.slots,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'carousel-cta':
      composed = await renderCarouselCta(
        width,
        height,
        input.brandKit,
        input.slots,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'split-screenshot-top':
      composed = await renderSplitScreenshotTop(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'device-mockup':
      composed = await renderDeviceMockup(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'story-bleed':
      composed = await renderStoryBleed(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'quote-editorial':
      composed = await renderQuoteEditorial(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'stat-solid':
      composed = await renderStatSolid(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        input.photoBuffer!,
        slideIndex,
        slideCount,
        layoutContext,
      );
      break;
    case 'gradient-hook':
    case 'cta-solid':
    case 'gradient-only':
    default:
      composed = await renderGradientText(
        width,
        height,
        input.brandKit,
        input.slots,
        input.templateId,
        slideIndex,
        slideCount,
        layout,
      );
      break;
  }

  const showLogo =
    Boolean(input.logoBuffer) &&
    (layout === 'carousel-cover' || slideCount === 1);
  if (showLogo && input.logoBuffer) {
    composed = await compositeLogo(
      composed,
      input.logoBuffer,
      input.logoMimeType ?? 'image/png',
      width,
      height,
      'top-left',
    );
  }

  return composed;
}
