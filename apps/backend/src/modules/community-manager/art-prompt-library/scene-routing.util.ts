import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { kitHasComposeImageRoles } from '../../product/domain/product-media-kit.constants';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ArtPromptScene } from './art-prompt.types';
import { resolveVisualIntent } from './visual-intent.util';

export interface CreativeSceneRoutingOptions {
  postIndex?: number;
  cmPortraitReady?: boolean;
}

const EXPLICIT_SCENES = new Set<ArtPromptScene>([
  'workspace',
  'hand-phone',
  'clinical',
  'abstract-premium',
]);

export function inferSceneFromIndustry(industry?: string | null): ArtPromptScene | undefined {
  if (!industry?.trim()) return undefined;
  const normalized = industry.toLowerCase();
  if (/dental|odont|clinic|clínica|salud|health|médic|medic|hospital/.test(normalized)) {
    return 'clinical';
  }
  if (/saas|software|tech|fintech|app/.test(normalized)) {
    return 'workspace';
  }
  return undefined;
}

export function resolveEffectiveScene(
  post: SocialCopyPost,
  industry?: string | null,
): ArtPromptScene {
  const intent = resolveVisualIntent(post);
  const explicit = intent.scene;
  if (explicit && explicit !== 'auto' && EXPLICIT_SCENES.has(explicit)) {
    return explicit;
  }

  const inferred = inferSceneFromIndustry(industry);
  if (inferred) return inferred;

  const isStory =
    post.imageDestination === 'story' ||
    post.platform === 'tiktok' ||
    post.visualTemplateId === 'story-vertical';

  if (isStory) return 'hand-phone';
  return 'workspace';
}

export function wouldUseRigidStoryTemplate(post: SocialCopyPost): boolean {
  const format = normalizeContentVisualFormat(post.visualFormat);
  if (format === 'talking-head') return false;
  return (
    post.visualTemplateId === 'story-vertical' ||
    post.imageDestination === 'story' ||
    post.platform === 'tiktok'
  );
}

/**
 * Whether SceneKitComposer should run (premium CM + environment + real app screen).
 */
export function shouldUseCreativeScene(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  options: CreativeSceneRoutingOptions = {},
): boolean {
  const format = normalizeContentVisualFormat(post.visualFormat);
  if (format === 'talking-head') return false;

  const intent = resolveVisualIntent(post);
  if (intent.preferLayout === 'template') return false;

  const hasKit = kitHasComposeImageRoles(kit ?? []);
  const scene = intent.scene;
  const explicitCreative =
    intent.preferLayout === 'creative-scene' ||
    intent.preferLayout === 'ai-art' ||
    (scene && scene !== 'auto' && EXPLICIT_SCENES.has(scene));

  if (scene === 'abstract-premium' || intent.preferLayout === 'creative-scene') {
    return true;
  }

  if (!hasKit && !explicitCreative) {
    return false;
  }

  if (explicitCreative) return true;

  if (wouldUseRigidStoryTemplate(post)) {
    return true;
  }

  if (hasKit && options.postIndex !== undefined) {
    if (intent.preferLayout === 'auto' && options.postIndex % 2 === 0) {
      return true;
    }
  }

  if (hasKit && options.cmPortraitReady && options.postIndex !== undefined) {
    if (options.postIndex % 3 === 0) return true;
  }

  return false;
}

export function shouldSkipTemplateForCreativeScene(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  options: CreativeSceneRoutingOptions = {},
): boolean {
  if (!shouldUseCreativeScene(post, kit, options)) return false;
  const intent = resolveVisualIntent(post);
  return (
    intent.preferLayout === 'creative-scene' ||
    intent.preferLayout === 'ai-art' ||
    wouldUseRigidStoryTemplate(post)
  );
}
