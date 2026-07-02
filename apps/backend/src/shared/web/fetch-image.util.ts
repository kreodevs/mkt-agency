const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; MktAgencyBot/1.0; +https://mkt-agency.app)';

export interface FetchedImage {
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
}

function inferContentTypeFromUrl(url: string): string | null {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  return null;
}

function looksLikeImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 32) {
    return false;
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return true;
  }

  const head = buffer.slice(0, 512).toString('utf8').trimStart();
  return head.startsWith('<svg') || head.includes('<svg');
}

function normalizeContentType(contentType: string | null, url: string, buffer: Buffer): string | null {
  const header = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';

  if (header.startsWith('image/')) {
    return header;
  }

  if (header === 'application/octet-stream' || header === 'binary/octet-stream' || !header) {
    const inferred = inferContentTypeFromUrl(url);
    if (inferred) {
      return inferred;
    }
  }

  if (looksLikeImageBuffer(buffer)) {
    return inferContentTypeFromUrl(url) ?? 'image/png';
  }

  return null;
}

export async function fetchImageBuffer(
  url: string,
  options?: { referer?: string; timeoutMs?: number },
): Promise<FetchedImage | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': DEFAULT_USER_AGENT,
        ...(options?.referer ? { Referer: options.referer } : {}),
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(options?.timeoutMs ?? 12000),
    });

    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return null;
    }

    const finalUrl = response.url || url;
    const contentType = normalizeContentType(
      response.headers.get('content-type'),
      finalUrl,
      buffer,
    );

    if (!contentType) {
      return null;
    }

    return { buffer, contentType, finalUrl };
  } catch {
    return null;
  }
}

export function isLikelyImageBuffer(buffer: Buffer, mimeType: string): boolean {
  if (mimeType.includes('svg')) {
    return buffer.length >= 120;
  }

  return looksLikeImageBuffer(buffer) && buffer.length >= 120;
}
