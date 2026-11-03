import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import {
  normalizeBrandFontFamily,
  stripCssFontQuotes,
} from '../../product/domain/brand-visual-kit.metadata.util';
import type { ResolvedVisualBrandKit } from './visual-brand-kit.util';
import { parseImageSize } from './visual-template-render.util';

export interface VisualTextOverlayInput {
  headline: string;
  subline?: string | null;
  cta?: string | null;
  brandKit?: ResolvedVisualBrandKit | null;
  size: ImageGenerationSize;
  platform?: string | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function svgFontFamily(fontStack: string): string {
  return `font-family='${escapeXml(stripCssFontQuotes(fontStack))}'`;
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
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
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

function isLightColor(hex?: string | null): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  // Standard luminance formula
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 160;
}

/**
 * Composites a high-contrast, modern typography overlay (headline, subline, CTA pill)
 * over a photo/art canvas with a cinematic lower-third gradient scrim.
 * Guarantees legibility on any photographic background.
 */
export async function compositeVisualTextOverlay(
  canvasBuffer: Buffer,
  input: VisualTextOverlayInput,
): Promise<Buffer> {
  const headline = input.headline?.trim();
  if (!headline) {
    return canvasBuffer;
  }

  const { width, height } = parseImageSize(input.size);
  const fontStack = input.brandKit?.fontFamily
    ? normalizeBrandFontFamily(input.brandKit.fontFamily)
    : 'Helvetica Neue, Arial, sans-serif';

  const primaryColor = input.brandKit?.primaryColor || '#0ea5e9';
  const accentColor = input.brandKit?.accentColor || primaryColor;
  const ctaBtnColor = accentColor;
  const ctaTextColor = isLightColor(ctaBtnColor) ? '#0f172a' : '#ffffff';

  const padding = Math.max(32, Math.round(width * 0.055));
  const headlineSize = Math.max(30, Math.round(width * 0.048));
  const sublineSize = Math.max(18, Math.round(headlineSize * 0.52));
  const ctaSize = Math.max(16, Math.round(headlineSize * 0.44));

  const headlineLines = wrapLines(headline, 24, 3);
  const subline = input.subline?.trim();
  const sublineLines = subline ? wrapLines(subline, 36, 2) : [];
  const cta = input.cta?.trim();

  // Calculate overlay dimensions (scrim covers bottom portion where text sits)
  const lineGap = Math.round(headlineSize * 0.22);
  const headlineHeight = headlineLines.length * (headlineSize + lineGap);
  const sublineGap = sublineLines.length ? Math.round(sublineSize * 0.3) : 0;
  const sublineHeight = sublineLines.length * (sublineSize + sublineGap);
  const ctaHeight = cta ? 52 : 0;
  const ctaMarginTop = cta ? 22 : 0;

  const contentTotalHeight =
    headlineHeight +
    (sublineLines.length ? 16 + sublineHeight : 0) +
    (cta ? ctaMarginTop + ctaHeight : 0);

  const scrimHeight = Math.min(
    Math.round(height * 0.48),
    Math.max(Math.round(height * 0.32), contentTotalHeight + padding * 2.2),
  );
  const scrimY = height - scrimHeight;
  const startContentY = height - padding - contentTotalHeight + headlineSize * 0.9;

  let currentY = startContentY;

  // Build headline SVG tspans
  const headlineTspans = headlineLines
    .map((line, idx) => {
      const y = currentY + idx * (headlineSize + lineGap);
      return `<tspan x="${padding}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  currentY += (headlineLines.length - 1) * (headlineSize + lineGap) + (sublineLines.length ? 22 : 0);

  // Build subline SVG tspans
  let sublineTspans = '';
  if (sublineLines.length) {
    sublineTspans = sublineLines
      .map((line, idx) => {
        const y = currentY + sublineSize + idx * (sublineSize + sublineGap);
        return `<tspan x="${padding}" y="${y}">${escapeXml(line)}</tspan>`;
      })
      .join('');
    currentY += sublineLines.length * (sublineSize + sublineGap);
  }

  // Build CTA pill button
  let ctaSvg = '';
  if (cta) {
    const ctaY = height - padding - ctaHeight;
    const ctaApproxWidth = Math.min(
      width - padding * 2,
      Math.max(180, Math.round(cta.length * (ctaSize * 0.68) + 48)),
    );
    const ctaTextX = padding + Math.round(ctaApproxWidth / 2);
    const ctaTextY = ctaY + Math.round(ctaHeight / 2) + Math.round(ctaSize * 0.35);

    ctaSvg = `
      <g>
        <rect x="${padding}" y="${ctaY}" width="${ctaApproxWidth}" height="${ctaHeight}" rx="${Math.round(ctaHeight / 2)}" fill="${escapeXml(ctaBtnColor)}" />
        <text x="${ctaTextX}" y="${ctaTextY}" text-anchor="middle" fill="${ctaTextColor}" ${svgFontFamily(fontStack)} font-size="${ctaSize}" font-weight="700" letter-spacing="0.3">${escapeXml(cta)}</text>
      </g>
    `;
  }

  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrimGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#05070b" stop-opacity="0" />
          <stop offset="28%" stop-color="#05070b" stop-opacity="0.48" />
          <stop offset="65%" stop-color="#05070b" stop-opacity="0.82" />
          <stop offset="100%" stop-color="#05070b" stop-opacity="0.94" />
        </linearGradient>
        <filter id="textDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.75" />
        </filter>
      </defs>
      <rect x="0" y="${scrimY}" width="${width}" height="${scrimHeight}" fill="url(#scrimGrad)" />
      <text fill="#ffffff" ${svgFontFamily(fontStack)} font-size="${headlineSize}" font-weight="800" letter-spacing="-0.5" filter="url(#textDropShadow)">
        ${headlineTspans}
      </text>
      ${
        sublineTspans
          ? `<text fill="rgba(241, 245, 249, 0.92)" ${svgFontFamily(fontStack)} font-size="${sublineSize}" font-weight="500" letter-spacing="-0.2" filter="url(#textDropShadow)">
              ${sublineTspans}
            </text>`
          : ''
      }
      ${ctaSvg}
    </svg>
  `;

  return sharp(canvasBuffer)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

