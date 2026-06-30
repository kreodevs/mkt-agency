export const CM_PLATFORMS = [
  'instagram',
  'linkedin',
  'twitter',
  'facebook',
  'tiktok',
] as const;

export type CmPlatform = (typeof CM_PLATFORMS)[number];

export const DEFAULT_CM_PLATFORMS: CmPlatform[] = ['instagram', 'linkedin'];
export const DEFAULT_CM_POST_COUNT = 3;
/** Posts generados al completar onboarding de producto (calendario ~1 semana) */
export const ONBOARDING_CM_POST_COUNT = 7;
