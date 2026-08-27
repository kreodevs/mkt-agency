import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
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
  slideIndex?: number;
  slideCount?: number;
  photoBuffer?: Buffer | null;
  logoBuffer?: Buffer | null;
  logoMimeType?: string | null;
}

export type VisualLayoutMode =
  | 'gradient-only'
  | 'gradient-hook'
  | 'cta-solid'
  | 'split-screenshot-top'
  | 'device-mockup'
  | 'story-bleed'
  | 'stat-solid'
  | 'quote-editorial';

const TEXT_PRIMARY = '#faf9f5';
const TEXT_MUTED = '#e8e6df';
const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';
const FONT_DISPLAY = '"Helvetica Neue", Arial, sans-serif';

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
  const headline =
    post.visualHeadline?.trim() ||
    summarizeHeadline(post.title, post.body, templateId === 'stat-highlight' ? 4 : 8);

  const subline =
    post.visualSubline?.trim() ||
    (templateId === 'quote-insight'
      ? truncateWords(post.body, 18)
      : templateId === 'tip-card' && slideCount > 1
        ? truncateWords(splitCarouselTips(post.body, slideCount)[slideIndex] ?? post.body, 14)
        : truncateWords(post.body, 12));

  const cta = post.visualCta?.trim() || truncateWords(post.callToAction, 4);

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

/** Elige composición según plantilla, slide de carrusel y si hay captura real. */
export function resolveVisualLayoutMode(
  templateId: VisualTemplateId,
  slideIndex: number,
  slideCount: number,
  hasPhoto: boolean,
): VisualLayoutMode {
  if (!hasPhoto) {
    return 'gradient-only';
  }

  if (slideCount > 1) {
    if (slideIndex === 0) {
      return 'gradient-hook';
    }
    if (slideIndex === slideCount - 1) {
      return 'cta-solid';
    }
    return 'split-screenshot-top';
  }

  switch (templateId) {
    case 'product-hero':
      return 'split-screenshot-top';
    case 'tip-card':
      return 'device-mockup';
    case 'promo-cta':
      return 'device-mockup';
    case 'quote-insight':
      return 'quote-editorial';
    case 'stat-highlight':
      return 'stat-solid';
    case 'story-vertical':
      return 'story-bleed';
    default:
      return 'split-screenshot-top';
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

function buildGradientSvg(width: number, height: number, kit: ResolvedVisualBrandKit): string {
  const angle = kit.style === 'luxury' ? 160 : 135;
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${kit.primaryColor}" />
        <stop offset="55%" stop-color="${kit.secondaryColor}" />
        <stop offset="100%" stop-color="${kit.accentColor}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
  </svg>`;
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
      ? `<text x="${width - padding}" y="${padding + 26}" text-anchor="end" fill="${TEXT_MUTED}" font-family="${FONT_SANS}" font-size="20" font-weight="600" opacity="0.9">${slideIndex + 1}/${slideCount}</text>`
      : '';

  const promoBadge =
    templateId === 'promo-cta' && variant !== 'cta-solid'
      ? `<rect x="${padding}" y="${padding}" rx="16" ry="16" width="${Math.min(width * 0.28, 200)}" height="44" fill="${kit.accentColor}"/>
         <text x="${padding + 18}" y="${padding + 30}" fill="${kit.secondaryColor}" font-family="${FONT_SANS}" font-size="18" font-weight="700">NUEVO</text>`
      : '';

  const ctaY = isCtaFocus
    ? Math.round(height * 0.58)
    : height - padding - 56;
  const ctaWidth = Math.min(width - padding * 2, isCtaFocus ? 480 : 380);

  const ctaBlock = slots.cta
    ? `<rect x="${padding}" y="${ctaY}" rx="28" ry="28" width="${ctaWidth}" height="56" fill="${kit.primaryColor}"/>
       <text x="${padding + 28}" y="${ctaY + 36}" fill="${TEXT_PRIMARY}" font-family="${FONT_SANS}" font-size="${ctaSize}" font-weight="700">${escapeXml(slots.cta)}</text>`
    : '';

  const statBlock =
    isStat && slots.statValue
      ? `<text x="${padding}" y="${contentY}" fill="${kit.accentColor}" font-family="${FONT_SANS}" font-size="${statSize}" font-weight="800" letter-spacing="-2">${escapeXml(slots.statValue)}</text>`
      : '';

  const headlineFont = isQuote ? 'Georgia, serif' : FONT_DISPLAY;
  const headlineY = statBlock ? contentY + statSize * 0.95 : contentY;
  const headlineBlock = statBlock
    ? `<text x="${padding}" y="${headlineY}" fill="${TEXT_PRIMARY}" font-family="${FONT_SANS}" font-size="${Math.round(headlineSize * 0.72)}" font-weight="600">${headlineTspans}</text>`
    : `<text x="${padding}" y="${headlineY}" fill="${TEXT_PRIMARY}" font-family="${headlineFont}" font-size="${headlineSize}" font-weight="700">${headlineTspans}</text>`;

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
    <text x="${padding}" y="${sublineY}" fill="${TEXT_MUTED}" font-family="${FONT_SANS}" font-size="${sublineSize}" font-weight="400">${sublineTspans}</text>
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

async function buildDeviceShadow(width: number, height: number, radius: number): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="${width - 16}" height="${height - 12}" rx="${radius}" ry="${radius}" fill="rgba(0,0,0,0.35)"/>
    </svg>`,
  );
  return sharp(svg).blur(8).png().toBuffer();
}

async function renderGradientBase(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
): Promise<Buffer> {
  return sharp(Buffer.from(buildGradientSvg(width, height, kit))).png().toBuffer();
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
): Promise<Buffer> {
  const photoHeight = Math.round(height * 0.52);
  const panelHeight = height - photoHeight;
  const fadeHeight = Math.min(56, Math.round(photoHeight * 0.14));

  const screenshot = await sharp(photoBuffer)
    .resize(width, photoHeight, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

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
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const frameW = Math.round(width * 0.84);
  const frameH = Math.round(height * 0.4);
  const frameLeft = Math.round((width - frameW) / 2);
  const frameTop = Math.round(height * 0.05);
  const radius = Math.round(width * 0.022);

  let screen = await sharp(photoBuffer)
    .resize(frameW, frameH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
  screen = await applyRoundedCorners(screen, frameW, frameH, radius);

  const shadow = await buildDeviceShadow(frameW + 24, frameH + 24, radius);
  const borderSvg = Buffer.from(
    `<svg width="${frameW + 4}" height="${frameH + 4}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${frameW + 2}" height="${frameH + 2}" rx="${radius + 2}" ry="${radius + 2}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
    </svg>`,
  );

  const textAreaTop = frameTop + frameH + Math.round(height * 0.04);
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
      { input: shadow, top: frameTop + 6, left: frameLeft - 12 },
      { input: screen, top: frameTop, left: frameLeft },
      { input: borderSvg, top: frameTop - 2, left: frameLeft - 2 },
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
): Promise<Buffer> {
  const photoHeight = Math.round(height * 0.58);
  const panelHeight = height - photoHeight;

  const screenshot = await sharp(photoBuffer)
    .resize(width, photoHeight, { fit: 'cover', position: 'centre' })
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
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const thumbW = Math.round(width * 0.34);
  const thumbH = Math.round(height * 0.22);
  const thumbLeft = width - thumbW - Math.round(width * 0.06);
  const thumbTop = Math.round(height * 0.06);
  const radius = 14;

  let thumb = await sharp(photoBuffer)
    .resize(thumbW, thumbH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
  thumb = await applyRoundedCorners(thumb, thumbW, thumbH, radius);

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
      <rect x="1" y="1" width="${thumbW + 2}" height="${thumbH + 2}" rx="${radius}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
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
): Promise<Buffer> {
  const base = await renderGradientBase(width, height, kit);
  const thumbW = Math.round(width * 0.28);
  const thumbH = Math.round(height * 0.16);
  const thumbLeft = width - thumbW - Math.round(width * 0.06);
  const thumbTop = Math.round(height * 0.06);

  let thumb = await sharp(photoBuffer)
    .resize(thumbW, thumbH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
  thumb = await applyRoundedCorners(thumb, thumbW, thumbH, 10);

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

async function compositeLogo(
  base: Buffer,
  logoBuffer: Buffer,
  mimeType: string | null,
  width: number,
  height: number,
): Promise<Buffer> {
  const logoWidth = Math.max(88, Math.round(Math.min(width, height) * 0.14));
  const pipeline =
    mimeType === 'image/svg+xml' ? sharp(logoBuffer, { density: 300 }) : sharp(logoBuffer);
  const logo = await pipeline.resize(logoWidth).png().toBuffer();
  const padding = Math.round(Math.min(width, height) * 0.04);
  return sharp(base).composite([{ input: logo, top: padding, left: padding }]).png().toBuffer();
}

export async function renderVisualTemplateFrame(
  input: RenderVisualTemplateInput,
): Promise<Buffer> {
  const { width, height } = parseImageSize(input.size);
  const slideIndex = input.slideIndex ?? 0;
  const slideCount = input.slideCount ?? 1;
  const hasPhoto = Boolean(input.photoBuffer);
  const layout = resolveVisualLayoutMode(
    input.templateId,
    slideIndex,
    slideCount,
    hasPhoto,
  );

  let composed: Buffer;

  switch (layout) {
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

  if (input.logoBuffer) {
    composed = await compositeLogo(
      composed,
      input.logoBuffer,
      input.logoMimeType ?? 'image/png',
      width,
      height,
    );
  }

  return composed;
}
