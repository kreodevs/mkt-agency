export interface SecurityAlertPayload {
  securityEventId: string;
  eventType: string;
  severity: string;
  userId?: string | null;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt?: string;
}

export interface SecurityAlertNotifierPort {
  notify(payload: SecurityAlertPayload): Promise<void>;
}

export const SECURITY_ALERT_NOTIFIER = Symbol('SECURITY_ALERT_NOTIFIER');
