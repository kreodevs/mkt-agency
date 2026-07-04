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
export const WEEKLY_CM_POST_COUNT = 5;
export const APPROVAL_REMINDER_HOURS = 48;
