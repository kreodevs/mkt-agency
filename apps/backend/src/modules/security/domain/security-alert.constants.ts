export const SECURITY_ALERT_OUTBOX_EVENT = 'SecurityAlert';

export const ALERT_SEVERITIES = ['high', 'critical'] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export function isAlertSeverity(severity: string): severity is AlertSeverity {
  return (ALERT_SEVERITIES as readonly string[]).includes(severity);
}
