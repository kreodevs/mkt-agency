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

function readLogoImages(html: string): string[] {
  const urls: string[] = [];
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = imgPattern.exec(html)) !== null) {
    const tag = match[0];
    const src = match[1];
    if (/logo|brand|marca/i.test(tag)) {
      urls.push(src);
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

/** Ordered candidates: icon links first, then logo-ish images, og:image last. */
export function extractLogoCandidates(html: string, pageUrl: string): string[] {
  const baseUrl = normalizePageUrl(pageUrl);
  const rawCandidates = [
    ...readLinkHref(html, /apple-touch-icon/i),
    ...readLinkHref(html, /icon/i),
    ...readLinkHref(html, /shortcut icon/i),
    ...readLogoImages(html),
    ...(readOgImage(html) ? [readOgImage(html)!] : []),
  ];

  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const candidate of rawCandidates) {
    const absolute = resolveAbsoluteUrl(candidate, baseUrl);
    if (!absolute || seen.has(absolute)) {
      continue;
    }
    seen.add(absolute);
    resolved.push(absolute);
  }

  return resolved;
}
