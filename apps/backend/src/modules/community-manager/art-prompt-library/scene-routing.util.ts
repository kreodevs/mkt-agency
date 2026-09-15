import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { kitHasComposeImageRoles } from '../../product/domain/product-media-kit.constants';
import type { ProductMediaKitItemEntity } from '../../product/infrastructure/typeorm/product-media-kit-item.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import { CREATIVE_SCENE_TEMPLATE_ID } from '../domain/visual-template.constants';
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

/** Templates that must stay in Visual Studio (typography/layout rigid). */
const RIGID_TEMPLATE_IDS = new Set([
  'stat-highlight',
  'tip-card',
  'quote-insight',
  'promo-cta',
]);

export function prefersRigidTemplate(post: SocialCopyPost): boolean {
  const id = post.visualTemplateId?.trim();
  return id ? RIGID_TEMPLATE_IDS.has(id) : false;
}

export function isCreativeSceneTemplateId(templateId?: string | null): boolean {
  return templateId?.trim() === CREATIVE_SCENE_TEMPLATE_ID;
}

/**
 * Posts that should show a real app screenshot via art-kit-compose (known mockup geometry).
 * Default lifestyle / CM scenes do NOT force a kit overlay.
 */
export function wantsProductScreenShowcase(post: SocialCopyPost): boolean {
  if (isCreativeSceneTemplateId(post.visualTemplateId)) {
    return false;
  }

  if (post.visualTemplateId === 'product-hero' || post.visualTemplateId === 'promo-cta') {
    return true;
  }

  const intent = resolveVisualIntent(post);
  if (intent.preferLayout === 'creative-scene') {
    return false;
  }

  const text = [
    intent.goal,
    intent.subject,
    post.visualHeadline,
    post.title,
    post.visualDescription,
    post.body,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /\b(captura|screenshot|interfaz|pantalla de la app|demo de la app|mockup|ui del producto|funcionalidad|dashboard|agenda semanal|vista de administrador)\b/.test(
    text,
  );
}

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

function layoutBlocksCreativeScene(post: SocialCopyPost): boolean {
  const intent = resolveVisualIntent(post);
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (format === 'carousel' || format === 'talking-head') {
    return true;
  }

  if (intent.preferLayout === 'template' && prefersRigidTemplate(post)) {
    return true;
  }

  return false;
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
  if (format === 'talking-head' || format === 'carousel') {
    return false;
  }

  if (layoutBlocksCreativeScene(post)) {
    return false;
  }

  if (wantsProductScreenShowcase(post)) {
    return false;
  }

  const intent = resolveVisualIntent(post);
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

  // Default: image posts with media kit → creative scene (not product-hero template)
  if (hasKit && !prefersRigidTemplate(post)) {
    return true;
  }

  if (hasKit && options.cmPortraitReady) {
    return true;
  }

  return false;
}

export function shouldSkipTemplateForCreativeScene(
  post: SocialCopyPost,
  kit: ProductMediaKitItemEntity[] | null | undefined,
  options: CreativeSceneRoutingOptions = {},
): boolean {
  return shouldUseCreativeScene(post, kit, options);
}
