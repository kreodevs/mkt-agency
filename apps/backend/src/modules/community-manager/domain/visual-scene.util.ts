import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ArtPromptScene } from '../art-prompt-library/art-prompt.types';
import { isVisualSceneId } from './visual-template.constants';

const EXPLICIT_SCENES = new Set<ArtPromptScene>([
  'workspace',
  'hand-phone',
  'clinical',
  'abstract-premium',
]);

/** Scene saved on content or provided by CM visualIntent. */
export function resolvePostVisualScene(post: SocialCopyPost): ArtPromptScene | null {
  const persisted = post.visualScene?.trim();
  if (persisted && isVisualSceneId(persisted)) {
    return persisted;
  }

  const fromIntent = post.visualIntent?.scene;
  if (fromIntent && fromIntent !== 'auto' && EXPLICIT_SCENES.has(fromIntent)) {
    return fromIntent;
  }

  return null;
}

/** Persist scene from CM batch when explicit; null lets routing infer from industry. */
export function resolveStoredVisualScene(post: SocialCopyPost): string | null {
  const scene = resolvePostVisualScene(post);
  return scene ?? null;
}
