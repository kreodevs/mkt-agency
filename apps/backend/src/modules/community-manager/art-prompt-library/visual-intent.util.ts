import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { kitHasComposeImageRoles } from '../../product/domain/product-media-kit.constants';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { VisualIntent } from './art-prompt.types';
import type {
  ArtPromptCarouselStructure,
  ArtPromptPreferLayout,
  ArtPromptScene,
  ArtPromptStyle,
} from './art-prompt.types';
import type { CreativeSceneRoutingOptions } from './scene-routing.util';
import {
  isCreativeSceneTemplateId,
  shouldUseCreativeScene,
  wantsProductScreenShowcase,
} from './scene-routing.util';

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

const VALID_LAYOUTS = new Set<ArtPromptPreferLayout>([
  'template',
  'ai-art',
  'auto',
  'creative-scene',
]);

const VALID_SCENES = new Set<ArtPromptScene>([
  'auto',
  'workspace',
  'hand-phone',
  'clinical',
  'abstract-premium',
]);

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

function pickScene(value: unknown): ArtPromptScene | undefined {
  const raw = pickString(value)?.toLowerCase();
  if (raw && VALID_SCENES.has(raw as ArtPromptScene)) {
    return raw as ArtPromptScene;
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
  const scene = pickScene(record.scene);

  if (goal) intent.goal = goal;
  if (subject) intent.subject = subject;
  if (style) intent.style = style;
  if (preferLayout) intent.preferLayout = preferLayout;
  if (carouselStructure) intent.carouselStructure = carouselStructure;
  if (scene) intent.scene = scene;

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

  if (isCreativeSceneTemplateId(post.visualTemplateId)) {
    intent.preferLayout = 'creative-scene';
  } else if (format === 'carousel') {
    intent.carouselStructure = 'hook-feature-cta';
    intent.preferLayout = 'template';
  } else if (format === 'talking-head') {
    intent.preferLayout = 'template';
  } else {
    intent.preferLayout = 'auto';
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
 * Whether art-kit-compose hybrid mode should run for this post.
 * Requires media kit compose roles and ai-art/auto layout preference.
 */
export function shouldUseArtKitCompose(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  sceneOptions?: CreativeSceneRoutingOptions,
): boolean {
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (format === 'talking-head') {
    return false;
  }

  if (!kitHasComposeImageRoles(kit ?? [])) {
    return false;
  }

  if (wantsProductScreenShowcase(post)) {
    return true;
  }

  if (shouldUseCreativeScene(post, kit, sceneOptions)) {
    return false;
  }

  const intent = resolveVisualIntent(post);
  if (intent.preferLayout === 'template' || intent.preferLayout === 'creative-scene') {
    return false;
  }

  return intent.preferLayout === 'ai-art' || intent.preferLayout === 'auto' || !intent.preferLayout;
}

/**
 * Whether the art prompt library should run for this post (pure IA path).
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

/** Resolve which visual pipeline should run for a post. */
export function resolveArtVisualMode(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  templateAttached?: boolean,
  sceneOptions?: CreativeSceneRoutingOptions,
): 'template' | 'creative-scene' | 'art-kit-compose' | 'art-prompt' | 'skip' {
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (format === 'talking-head') {
    return 'skip';
  }

  const intent = resolveVisualIntent(post);

  if (intent.preferLayout === 'template' && !templateAttached) {
    return 'template';
  }

  if (templateAttached) {
    return 'skip';
  }

  if (shouldUseCreativeScene(post, kit, sceneOptions)) {
    return 'creative-scene';
  }

  if (shouldUseArtKitCompose(post, kit, sceneOptions)) {
    return 'art-kit-compose';
  }

  if (shouldUseArtPromptLibrary(post, kit, templateAttached)) {
    return 'art-prompt';
  }

  if (intent.preferLayout === 'template') {
    return 'template';
  }

  return 'skip';
}
