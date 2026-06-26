export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: SecurityEventSeverity;
  userId: string | null;
  tenantId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface ListSecurityEventsParams {
  page?: number;
  limit?: number;
  severity?: SecurityEventSeverity;
  eventType?: string;
}

export interface PaginatedSecurityEventsResponse {
  items: SecurityEvent[];
  total: number;
  page: number;
  limit: number;
}
