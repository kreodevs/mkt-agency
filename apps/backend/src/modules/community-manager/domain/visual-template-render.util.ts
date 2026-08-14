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

function buildOverlaySvg(
  width: number,
  height: number,
  kit: ResolvedVisualBrandKit,
  slots: VisualTemplateSlots,
  templateId: VisualTemplateId,
  slideIndex: number,
  slideCount: number,
): string {
  const padding = Math.round(width * 0.08);
  const headlineSize =
    templateId === 'stat-highlight'
      ? Math.round(width * 0.16)
      : templateId === 'story-vertical'
        ? Math.round(width * 0.09)
        : Math.round(width * 0.075);
  const sublineSize = Math.round(headlineSize * 0.42);
  const ctaSize = Math.round(headlineSize * 0.38);
  const textColor = '#faf9f5';
  const mutedColor = '#f0eee6';
  const accent = kit.accentColor;

  const headlineLines = wrapTextLines(
    slots.headline,
    templateId === 'story-vertical' ? 16 : 20,
    templateId === 'quote-insight' ? 4 : 3,
  );
  const sublineLines = wrapTextLines(slots.subline ?? '', 28, templateId === 'tip-card' ? 5 : 3);

  let y = templateId === 'story-vertical' ? height * 0.62 : height * 0.28;
  const headlineTspans = headlineLines
    .map((line, index) => {
      const dy = index === 0 ? 0 : headlineSize * 1.1;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const sublineTspans = sublineLines
    .map((line, index) => {
      const dy = index === 0 ? sublineSize * 1.4 : sublineSize * 1.25;
      return `<tspan x="${padding}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const statBlock =
    templateId === 'stat-highlight' && slots.statValue
      ? `<text x="${padding}" y="${y}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${Math.round(headlineSize * 1.4)}" font-weight="700">${escapeXml(slots.statValue)}</text>`
      : '';

  const badge =
    templateId === 'promo-cta'
      ? `<rect x="${padding}" y="${padding}" rx="18" ry="18" width="${Math.min(width * 0.35, 280)}" height="56" fill="${accent}" opacity="0.95"/>
         <text x="${padding + 24}" y="${padding + 36}" fill="${kit.secondaryColor}" font-family="Arial, sans-serif" font-size="24" font-weight="700">NUEVO</text>`
      : '';

  const slideBadge =
    slideCount > 1
      ? `<text x="${width - padding}" y="${padding + 28}" text-anchor="end" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="22" font-weight="600">${slideIndex + 1}/${slideCount}</text>`
      : '';

  const ctaBlock = slots.cta
    ? `<rect x="${padding}" y="${height - padding - 72}" rx="28" ry="28" width="${Math.min(width - padding * 2, 420)}" height="56" fill="${kit.primaryColor}" opacity="0.95"/>
       <text x="${padding + 28}" y="${height - padding - 36}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${ctaSize}" font-weight="700">${escapeXml(slots.cta)}</text>`
    : '';

  const panelOpacity = kit.style === 'bold' ? 0.72 : 0.58;
  const panelY = templateId === 'story-vertical' ? height * 0.52 : height * 0.18;
  const panelHeight = templateId === 'story-vertical' ? height * 0.4 : height * 0.62;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="${panelY}" width="${width}" height="${panelHeight}" fill="${kit.secondaryColor}" opacity="${panelOpacity}" />
    ${badge}
    ${slideBadge}
    ${statBlock || `<text x="${padding}" y="${y}" fill="${textColor}" font-family="Georgia, serif" font-size="${headlineSize}" font-weight="700">${headlineTspans}</text>`}
    <text x="${padding}" y="${y + headlineSize * (headlineLines.length + 0.5)}" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="${sublineSize}" font-weight="400">${sublineTspans}</text>
    ${ctaBlock}
  </svg>`;
}

async function resizeCover(buffer: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

async function compositeLogo(
  base: Buffer,
  logoBuffer: Buffer,
  mimeType: string | null,
  width: number,
  height: number,
): Promise<Buffer> {
  const logoWidth = Math.max(96, Math.round(Math.min(width, height) * 0.16));
  const pipeline = mimeType === 'image/svg+xml'
    ? sharp(logoBuffer, { density: 300 })
    : sharp(logoBuffer);
  const logo = await pipeline.resize(logoWidth).png().toBuffer();
  const padding = Math.round(Math.min(width, height) * 0.04);
  return sharp(base)
    .composite([{ input: logo, top: padding, left: padding }])
    .png()
    .toBuffer();
}

export async function renderVisualTemplateFrame(
  input: RenderVisualTemplateInput,
): Promise<Buffer> {
  const { width, height } = parseImageSize(input.size);
  const slideIndex = input.slideIndex ?? 0;
  const slideCount = input.slideCount ?? 1;

  let base: Buffer;
  if (input.photoBuffer) {
    base = await resizeCover(input.photoBuffer, width, height);
    const dimOverlay = Buffer.from(
      `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="rgba(20,20,19,0.28)"/></svg>`,
    );
    base = await sharp(base).composite([{ input: dimOverlay, top: 0, left: 0 }]).png().toBuffer();
  } else {
    base = await sharp(Buffer.from(buildGradientSvg(width, height, input.brandKit))).png().toBuffer();
  }

  const overlaySvg = buildOverlaySvg(
    width,
    height,
    input.brandKit,
    input.slots,
    input.templateId,
    slideIndex,
    slideCount,
  );
  let composed = await sharp(base)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

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
