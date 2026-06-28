export interface SocialCopyPost {
  id: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'tiktok';
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
  bestTime: string;
  targetAudience: string;
  callToAction: string;
  tone: string;
  contentId?: string;
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
  platforms: string[];
  count: number;
  campaignId?: string;
  tone?: string;
  topics?: string[];
}

export interface SocialCopyAdapterPort {
  generate(context: SocialCopyContext): Promise<SocialCopyBatch>;
}

export const SOCIAL_COPY_ADAPTER = Symbol('SOCIAL_COPY_ADAPTER');