export const AGENCY_NOTIFICATION_TYPES = {
  WEEK_READY: 'week_ready',
  APPROVAL_REMINDER: 'approval_reminder',
  PUBLISH_REMINDER: 'publish_reminder',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

export type AgencyNotificationType =
  (typeof AGENCY_NOTIFICATION_TYPES)[keyof typeof AGENCY_NOTIFICATION_TYPES];

export const INBOX_LOOKAHEAD_DAYS = 14;
export const INBOX_LOOKBACK_DAYS = 7;
export const DAILY_CM_POSTS_PER_PLATFORM = 2;
export const WEEKLY_CM_POST_COUNT = 5;
export const APPROVAL_REMINDER_HOURS = 48;

export const COPILOT_PREPARE_HORIZONS = ['day', 'week'] as const;
export type CopilotPrepareHorizon = (typeof COPILOT_PREPARE_HORIZONS)[number];

export function postCountForHorizon(
  horizon: CopilotPrepareHorizon,
  platformCount: number,
): number {
  if (horizon === 'day') {
    return Math.max(platformCount, 1) * DAILY_CM_POSTS_PER_PLATFORM;
  }
  return WEEKLY_CM_POST_COUNT;
}

export function copilotHorizonLabel(horizon: CopilotPrepareHorizon): string {
  return horizon === 'day' ? 'día' : 'semana';
}
