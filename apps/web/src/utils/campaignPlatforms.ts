import type { CmPlatform } from '@/services/community-manager';

export const CAMPAIGN_PLATFORMS = [
  'facebook',
  'instagram',
  'google',
  'linkedin',
  'tiktok',
  'email',
] as const;

export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];

const CM_PLATFORM_SET = new Set<string>(['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok']);

export function campaignPlatformsForCommunityManager(platforms: string[]): CmPlatform[] {
  return platforms.filter((platform): platform is CmPlatform => CM_PLATFORM_SET.has(platform));
}

export function campaignPlatformLabel(platform: string): string {
  if (platform === 'email') return 'Email';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}
