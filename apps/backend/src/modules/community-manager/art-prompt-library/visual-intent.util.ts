import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { kitHasComposeImageRoles } from '../../product/domain/product-media-kit.constants';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { VisualIntent } from './art-prompt.types';
import type {
  ArtPromptCarouselStructure,
  ArtPromptPreferLayout,
  ArtPromptStyle,
} from './art-prompt.types';

const VALID_STYLES = new Set<ArtPromptStyle>([
  'minimal',
  'bold',
  'luxury',
  'editorial',
  'playful',
  'technical',
  'photoreal',
  'illustration',
  'flatlay',
  'infographic',
]);

const VALID_LAYOUTS = new Set<ArtPromptPreferLayout>(['template', 'ai-art', 'auto']);

const VALID_CAROUSEL_STRUCTURES = new Set<ArtPromptCarouselStructure>([
  'hook-feature-cta',
  'listicle',
  'before-after',
  'step-by-step',
  'multi-stat',
]);

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickStyle(value: unknown): ArtPromptStyle | undefined {
  const raw = pickString(value)?.toLowerCase();
  if (raw && VALID_STYLES.has(raw as ArtPromptStyle)) {
    return raw as ArtPromptStyle;
  }
  return undefined;
}

function pickLayout(value: unknown): ArtPromptPreferLayout | undefined {
  const raw = pickString(value)?.toLowerCase();
  if (raw && VALID_LAYOUTS.has(raw as ArtPromptPreferLayout)) {
    return raw as ArtPromptPreferLayout;
  }
  return undefined;
}

function pickCarouselStructure(value: unknown): ArtPromptCarouselStructure | undefined {
  const raw = pickString(value)?.toLowerCase();
  if (raw && VALID_CAROUSEL_STRUCTURES.has(raw as ArtPromptCarouselStructure)) {
    return raw as ArtPromptCarouselStructure;
  }
  return undefined;
}

/** Parse and validate visualIntent from LLM JSON. */
export function normalizeVisualIntent(raw: unknown): VisualIntent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const intent: VisualIntent = {};

  const goal = pickString(record.goal);
  const subject = pickString(record.subject);
  const style = pickStyle(record.style);
  const preferLayout = pickLayout(record.preferLayout ?? record.prefer_layout);
  const carouselStructure = pickCarouselStructure(
    record.carouselStructure ?? record.carousel_structure,
  );

  if (goal) intent.goal = goal;
  if (subject) intent.subject = subject;
  if (style) intent.style = style;
  if (preferLayout) intent.preferLayout = preferLayout;
  if (carouselStructure) intent.carouselStructure = carouselStructure;

  return Object.keys(intent).length > 0 ? intent : null;
}

/** Infer visual intent from post fields when LLM did not provide visualIntent. */
export function inferVisualIntentFromPost(post: SocialCopyPost): VisualIntent {
  const intent: VisualIntent = {};
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (post.visualHeadline?.trim()) {
    intent.subject = post.visualHeadline.trim();
  } else if (post.title?.trim()) {
    intent.subject = post.title.trim();
  }

  if (post.callToAction?.trim()) {
    intent.goal = post.callToAction.trim();
  }

  if (format === 'carousel') {
    intent.carouselStructure = 'hook-feature-cta';
    intent.preferLayout = post.visualTemplateId ? 'template' : 'auto';
  } else if (format === 'talking-head') {
    intent.preferLayout = 'template';
  } else {
    intent.preferLayout = post.visualTemplateId ? 'template' : 'auto';
  }

  if (post.tone?.toLowerCase().includes('profesional')) {
    intent.style = 'minimal';
  } else if (post.tone?.toLowerCase().includes('juvenil')) {
    intent.style = 'playful';
  }

  return intent;
}

/** Resolve effective visual intent merging explicit LLM intent with inferred defaults. */
export function resolveVisualIntent(post: SocialCopyPost): VisualIntent {
  const inferred = inferVisualIntentFromPost(post);
  if (!post.visualIntent) {
    return inferred;
  }
  return {
    ...inferred,
    ...post.visualIntent,
  };
}

/**
 * Whether the art prompt library should run for this post.
 * Skips template-preferred layouts, talking-head, and when media kit blocks AI.
 */
export function shouldUseArtPromptLibrary(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  templateAttached?: boolean,
): boolean {
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (format === 'talking-head') {
    return false;
  }

  const intent = resolveVisualIntent(post);
  if (intent.preferLayout === 'template') {
    return false;
  }

  if (templateAttached) {
    return false;
  }

  if (kitHasComposeImageRoles(kit ?? [])) {
    return false;
  }

  if (!post.visualDescription?.trim() && !intent.subject?.trim()) {
    return false;
  }

  return true;
}
