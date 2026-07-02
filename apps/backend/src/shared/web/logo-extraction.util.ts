import { normalizePageUrl } from './page-content.util';

function resolveAbsoluteUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('data:')) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function pushCandidate(scores: Map<string, number>, url: string | null, score: number): void {
  if (!url || score <= 0) {
    return;
  }

  const current = scores.get(url);
  if (current === undefined || score > current) {
    scores.set(url, score);
  }
}

function readLinkHref(html: string, relPattern: RegExp): string[] {
  const pattern = new RegExp(
    `<link[^>]+rel=["'][^"']*${relPattern.source}[^"']*["'][^>]+href=["']([^"']+)["']`,
    'gi',
  );
  const altPattern = new RegExp(
    `<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${relPattern.source}[^"']*["']`,
    'gi',
  );

  const urls: string[] = [];
  for (const regex of [pattern, altPattern]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
  }

  return urls;
}

function readOgImage(html: string): string | null {
  const pattern =
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i;
  const altPattern =
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i;
  return pattern.exec(html)?.[1]?.trim() ?? altPattern.exec(html)?.[1]?.trim() ?? null;
}

function extractHeaderFragments(html: string): string[] {
  const fragments: string[] = [];

  const patterns = [
    /<header[^>]*>[\s\S]*?<\/header>/gi,
    /<div[^>]*role=["']banner["'][^>]*>[\s\S]*?<\/div>/gi,
    /<nav[^>]*class=["'][^"']*header[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      fragments.push(match[0]);
    }
  }

  return fragments;
}

function isLikelyFavicon(src: string, tag: string): boolean {
  const haystack = `${src} ${tag}`.toLowerCase();
  return (
    /\.ico(\?|$)/.test(haystack) ||
    /favicon|icon-16|icon-32|icon-48|sizes=["']16x16|32x32|48x48/i.test(haystack) ||
    /rel=["'][^"']*icon/i.test(tag)
  );
}

function scoreLogoImage(tag: string, src: string, context: { inHeader: boolean; inLogoAnchor: boolean }): number {
  if (/spacer|pixel|1x1|tracking|blank\.gif|transparent\.gif/i.test(src)) {
    return 0;
  }

  if (isLikelyFavicon(src, tag)) {
    return 0;
  }

  let score = 0;
  const combined = `${tag} ${src}`;

  if (context.inLogoAnchor) {
    score += 100;
  }

  if (context.inHeader) {
    score += 35;
  }

  if (/header-logo|site-logo|brand-logo|navbar-brand|logo-link|class=["'][^"']*logo/i.test(combined)) {
    score += 80;
  }

  if (/(^|\/)[^"'\s?#]*logo[^"'\s?#]*\.(png|jpe?g|webp|svg)(\?|$)/i.test(src)) {
    score += 75;
  }

  if (/alt=["'][^"']*(logo|marca|brand)/i.test(tag)) {
    score += 45;
  }

  if (/class=["'][^"']*logo|id=["'][^"']*logo/i.test(tag)) {
    score += 50;
  }

  if (/brand|marca|logotipo|logotype/i.test(combined)) {
    score += 25;
  }

  const widthMatch = tag.match(/width=["'](\d+)["']/i);
  if (widthMatch) {
    const width = Number(widthMatch[1]);
    if (width >= 28 && width <= 600) {
      score += 15;
    }
    if (width > 0 && width < 24) {
      score -= 30;
    }
  }

  return score;
}

function collectImagesFromHtml(
  html: string,
  baseUrl: string,
  scores: Map<string, number>,
  context: { inHeader: boolean; inLogoAnchor: boolean },
  minScore: number,
): void {
  const imgPattern = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(html)) !== null) {
    const tag = match[0];
    const src = readImgSrc(tag);
    if (!src) {
      continue;
    }

    const score = scoreLogoImage(tag, src, context);
    if (score >= minScore) {
      pushCandidate(scores, resolveAbsoluteUrl(src, baseUrl), score);
    }
  }
}

function readImgSrc(tag: string): string | null {
  const dataSrc =
    tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ??
    tag.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1];
  const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  const srcset = readBestSrcsetUrl(tag);

  const candidates = [dataSrc, srcset, src].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (!candidate.startsWith('data:') && !/placeholder|1x1|spacer|blank/i.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

function readBestSrcsetUrl(tag: string): string | null {
  const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
  if (!srcset) {
    return null;
  }

  let bestUrl: string | null = null;
  let bestScore = -1;

  for (const part of srcset.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const [url, descriptor = '1x'] = trimmed.split(/\s+/, 2);
    if (!url || url.startsWith('data:')) {
      continue;
    }

    let score = 1;
    const widthMatch = descriptor.match(/^(\d+)w$/i);
    const densityMatch = descriptor.match(/^([\d.]+)x$/i);
    if (widthMatch) {
      score = Number(widthMatch[1]);
    } else if (densityMatch) {
      score = Number(densityMatch[1]) * 1000;
    }

    if (score >= bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  }

  return bestUrl;
}

function collectLogoAnchors(html: string, baseUrl: string, scores: Map<string, number>): void {
  const anchorPattern =
    /<a[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const anchorHtml = match[0];
    collectImagesFromHtml(anchorHtml, baseUrl, scores, { inHeader: false, inLogoAnchor: true }, 1);

    const imgMatch = /<img\b[^>]*>/i.exec(anchorHtml);
    if (imgMatch) {
      const src = readImgSrc(imgMatch[0]);
      if (src) {
        pushCandidate(scores, resolveAbsoluteUrl(src, baseUrl), 120);
      }
    }
  }
}

function collectHeaderLogos(html: string, baseUrl: string, scores: Map<string, number>): void {
  const headers = extractHeaderFragments(html);
  const scopes = headers.length > 0 ? headers : [html.slice(0, Math.min(html.length, 30000))];

  for (const fragment of scopes) {
    collectLogoAnchors(fragment, baseUrl, scores);
    collectImagesFromHtml(fragment, baseUrl, scores, { inHeader: true, inLogoAnchor: false }, 40);
  }
}

function collectGlobalLogoImages(html: string, baseUrl: string, scores: Map<string, number>): void {
  collectImagesFromHtml(html, baseUrl, scores, { inHeader: false, inLogoAnchor: false }, 55);
}

function collectMetaFallbacks(html: string, baseUrl: string, scores: Map<string, number>): void {
  for (const href of readLinkHref(html, /apple-touch-icon/i)) {
    pushCandidate(scores, resolveAbsoluteUrl(href, baseUrl), 45);
  }

  const ogImage = readOgImage(html);
  if (ogImage) {
    pushCandidate(scores, resolveAbsoluteUrl(ogImage, baseUrl), 40);
  }

  for (const href of readLinkHref(html, /shortcut icon/i)) {
    pushCandidate(scores, resolveAbsoluteUrl(href, baseUrl), 10);
  }

  for (const href of readLinkHref(html, /icon/i)) {
    const absolute = resolveAbsoluteUrl(href, baseUrl);
    if (absolute && /\.ico(\?|$)/i.test(absolute)) {
      pushCandidate(scores, absolute, 5);
    }
  }
}

/**
 * Logo candidates ordered by relevance (header/logo markup first, favicon last).
 */
export function extractLogoCandidates(html: string, pageUrl: string): string[] {
  const baseUrl = normalizePageUrl(pageUrl);
  const scores = new Map<string, number>();

  collectLogoAnchors(html, baseUrl, scores);
  collectHeaderLogos(html, baseUrl, scores);
  collectGlobalLogoImages(html, baseUrl, scores);
  collectMetaFallbacks(html, baseUrl, scores);

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([url]) => url);
}
