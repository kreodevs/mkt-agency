export const INTERACTION_INTENTS = [
  'pending',
  'support',
  'spam',
  'brand',
  'prospect',
] as const;

export type InteractionIntent = (typeof INTERACTION_INTENTS)[number];

export const INTERACTION_STATUSES = ['open', 'replied', 'escalated', 'dismissed'] as const;

export type InteractionStatus = (typeof INTERACTION_STATUSES)[number];

export const SOCIAL_PLATFORMS = ['manual', 'instagram', 'facebook', 'tiktok', 'whatsapp'] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_CHANNELS = ['comment', 'dm', 'mention', 'review'] as const;

export type SocialChannel = (typeof SOCIAL_CHANNELS)[number];
