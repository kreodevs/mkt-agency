import type { ContentVisualFormat } from '../../content/domain/content.constants';
import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import { CM_PLATFORMS, type CmPlatform } from './cm-platforms.constants';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';

export interface ContentVisualDesignSource {
  id: string;
  platform: string | null;
  visualFormat: string;
  visualPrompt: string | null;
  visualTemplateId: string | null;
  visualHeadline: string | null;
  visualSubline: string | null;
  visualCta: string | null;
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
    visualHeadline: content.visualHeadline ?? undefined,
    visualSubline: content.visualSubline ?? undefined,
    visualCta: content.visualCta ?? undefined,
    bestTime: '',
    targetAudience: '',
    callToAction: content.visualCta?.trim() || 'Ver más',
    tone: '',
    contentId: content.id,
  };
}
