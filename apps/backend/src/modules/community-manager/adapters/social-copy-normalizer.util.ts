import type { SocialCopyPost } from './social-copy.adapter.port';
import { inferContentVisualFormat, normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';

const ALLOWED_PLATFORMS = new Set(['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok']);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function pickStringArray(record: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) {
      continue;
    }

    const items = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => item.replace(/^#/, ''));

    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

function normalizePlatform(value: unknown, platforms: string[], index: number): SocialCopyPost['platform'] {
  const raw = String(value ?? '').trim().toLowerCase();
  if (ALLOWED_PLATFORMS.has(raw)) {
    return raw as SocialCopyPost['platform'];
  }

  const fallback = platforms[index % platforms.length] ?? platforms[0] ?? 'instagram';
  return ALLOWED_PLATFORMS.has(fallback)
    ? (fallback as SocialCopyPost['platform'])
    : 'instagram';
}

function extractPostsArray(raw: unknown): unknown[] {
  const record = asRecord(raw);
  if (!record) {
    return [];
  }

  const candidates = [record.posts, record.publicaciones, record.items, record.content];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

export function normalizeSocialCopyBatch(
  raw: unknown,
  context: { count: number; platforms: string[] },
): { summary: string; posts: SocialCopyPost[]; publishingGuide: string; generatedAt?: string } {
  const record = asRecord(raw) ?? {};
  const postsRaw = extractPostsArray(raw);

  const posts = postsRaw
    .slice(0, Math.max(context.count, 1))
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      const body = pickString(row, ['body', 'texto', 'text', 'content', 'copy', 'caption']);
      if (!body) {
        return null;
      }

      return {
        id: pickString(row, ['id']) || `post-${index + 1}`,
        platform: normalizePlatform(row.platform ?? row.plataforma, context.platforms, index),
        title: pickString(row, ['title', 'titulo', 'headline']) || `Publicación ${index + 1}`,
        body,
        hashtags: pickStringArray(row, ['hashtags', 'tags', 'etiquetas']),
        visualDescription: pickString(row, [
          'visualDescription',
          'visual_description',
          'descripcionVisual',
          'imageDescription',
        ]),
        visualFormat: normalizeContentVisualFormat(
          pickString(row, ['visualFormat', 'visual_format', 'formatoVisual', 'formato_visual']) ||
            inferContentVisualFormat(
              normalizePlatform(row.platform ?? row.plataforma, context.platforms, index),
            ),
        ),
        bestTime: pickString(row, ['bestTime', 'best_time', 'horaIdeal']) || '09:00',
        targetAudience:
          pickString(row, ['targetAudience', 'target_audience', 'audiencia']) || 'Audiencia del producto',
        callToAction: pickString(row, ['callToAction', 'call_to_action', 'cta']) || 'Conoce más',
        tone: pickString(row, ['tone', 'tono']) || 'profesional',
      } satisfies SocialCopyPost;
    })
    .filter((post): post is SocialCopyPost => Boolean(post));

  return {
    summary:
      pickString(record, ['summary', 'resumen']) ||
      `Tanda de ${posts.length} publicaciones generadas para ${context.platforms.join(', ')}`,
    posts,
    publishingGuide:
      pickString(record, ['publishingGuide', 'publishing_guide', 'guiaPublicacion', 'guide']) ||
      'Publica en horario laboral y adapta el tono a cada red.',
    generatedAt: pickString(record, ['generatedAt', 'generated_at']) || undefined,
  };
}
