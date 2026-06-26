export const CAMPAIGN_STATUSES = [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const PLATFORMS = [
  'facebook',
  'instagram',
  'google',
  'linkedin',
  'tiktok',
  'email',
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const STRATEGY_TASK_TYPE = 'generate_campaign_strategy';
