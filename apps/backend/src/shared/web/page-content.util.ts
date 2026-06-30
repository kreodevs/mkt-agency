export interface PageMetadata {
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

export interface FetchedPageContent {
  url: string;
  html: string;
  text: string;
  metadata: PageMetadata;
}

export function normalizePageUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export async function fetchPageContent(url: string): Promise<FetchedPageContent> {
  const cleanUrl = normalizePageUrl(url);

  const response = await fetch(cleanUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MktAgencyBot/1.0; +https://mkt-agency.app)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener la URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const text = htmlToPlainText(html);
  const metadata = extractPageMetadata(html);

  return { url: cleanUrl, html, text, metadata };
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readMetaContent(html: string, attr: 'name' | 'property', key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`,
    'i',
  );
  const altPattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`,
    'i',
  );
  return pattern.exec(html)?.[1]?.trim() ?? altPattern.exec(html)?.[1]?.trim() ?? null;
}

export function extractPageMetadata(html: string): PageMetadata {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return {
    title: titleMatch?.[1]?.trim() ?? null,
    metaDescription: readMetaContent(html, 'name', 'description'),
    metaKeywords: readMetaContent(html, 'name', 'keywords'),
    ogTitle: readMetaContent(html, 'property', 'og:title'),
    ogDescription: readMetaContent(html, 'property', 'og:description'),
  };
}
