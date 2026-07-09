export const MEDIA_INTENT_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'launched_manual',
  'paused',
] as const;

export type MediaIntentStatus = (typeof MEDIA_INTENT_STATUSES)[number];
