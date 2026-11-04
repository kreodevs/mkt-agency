import type { ContentImageDestination, ContentVisualFormat } from '../../content/domain/content.constants';
import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { CM_PLATFORMS, type CmPlatform } from './cm-platforms.constants';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import { isVisualSceneId } from './visual-template.constants';
import { summarizeHeadline } from './visual-template-render.util';

export function resolveContentImageDestination(
  post: {
    imageDestination?: string | null;
    visualTemplateId?: string | null;
  },
): ContentImageDestination {
  if (post.imageDestination === 'story') {
    return 'story';
  }
  if (post.visualTemplateId === 'story-vertical') {
    return 'story';
  }
  return 'feed';
}

export interface ContentVisualDesignSource {
  id: string;
  platform: string | null;
  visualFormat: string;
  visualPrompt: string | null;
  visualTemplateId: string | null;
  visualScene: string | null;
  visualHeadline: string | null;
  visualSubline: string | null;
  visualCta: string | null;
  imageDestination?: string | null;
}

export interface ContentVersionCopySource {
  title: string;
  body: string;
}

function resolvePlatform(platform: string | null): CmPlatform {
  if (platform && (CM_PLATFORMS as readonly string[]).includes(platform)) {
    return platform as CmPlatform;
  }
  return 'instagram';
}

export function socialCopyPostFromContent(
  content: ContentVisualDesignSource,
  version: ContentVersionCopySource,
): SocialCopyPost {
  const visualFormat = normalizeContentVisualFormat(content.visualFormat) as ContentVisualFormat;
  return {
    id: content.id,
    platform: resolvePlatform(content.platform),
    title: version.title,
    body: version.body,
    hashtags: [],
    visualDescription: content.visualPrompt?.trim() ?? '',
    visualFormat,
    visualTemplateId: content.visualTemplateId ?? undefined,
    visualScene:
      content.visualScene && isVisualSceneId(content.visualScene)
        ? content.visualScene
        : undefined,
    visualHeadline:
      content.visualHeadline?.trim() ||
      summarizeHeadline(version.title, version.body, 8),
    visualSubline: content.visualSubline?.trim() || undefined,
    visualCta: content.visualCta?.trim() || 'Conoce más',
    imageDestination: resolveContentImageDestination({
      imageDestination: content.imageDestination,
      visualTemplateId: content.visualTemplateId,
    }),
    bestTime: '',
    targetAudience: '',
    callToAction: content.visualCta?.trim() || 'Ver más',
    tone: '',
    contentId: content.id,
  };
}
