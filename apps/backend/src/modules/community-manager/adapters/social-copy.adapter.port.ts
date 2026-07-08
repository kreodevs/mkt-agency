import type { ContentVisualFormat } from '../../content/domain/content.constants';
import type { CmCharacterLlmOption } from '../domain/cm-character.constants';

export interface SocialCopyPost {
  id: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'tiktok';
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
  /** Formato visual a generar: image | carousel (sin video IA). */
  visualFormat: ContentVisualFormat;
  bestTime: string;
  targetAudience: string;
  callToAction: string;
  tone: string;
  contentId?: string;
  /** CM virtual elegida por el LLM para talking-head (debe existir en la biblioteca). */
  cmCharacterId?: string;
}

export interface SocialCopyBatch {
  summary: string;
  posts: SocialCopyPost[];
  publishingGuide: string;
  generatedAt: string;
}

export interface SocialCopyContext {
  tenantId: string;
  brandBrief?: Record<string, unknown> | null;
  productContext?: Record<string, unknown> | null;
  focusProductName?: string | null;
  platforms: string[];
  count: number;
  campaignId?: string;
  productId?: string;
  tone?: string;
  topics?: string[];
  competitorIntelBrief?: Record<string, unknown> | null;
  /** Feedback del usuario para revisar un post existente. */
  revisionBrief?: string;
  previousPost?: {
    title: string;
    body: string;
    platform?: string;
  };
  mediaKit?: Array<{
    role: string;
    label: string | null;
    assetType: 'image' | 'video';
  }>;
  /** Al menos una CM virtual lista — habilita visualFormat talking-head en TikTok. */
  cmCharacterReady?: boolean;
  /** CMs listas que el LLM puede elegir por post. */
  cmCharacters?: CmCharacterLlmOption[];
}

export interface SocialCopyAdapterPort {
  generate(context: SocialCopyContext): Promise<SocialCopyBatch>;
}

export const SOCIAL_COPY_ADAPTER = Symbol('SOCIAL_COPY_ADAPTER');