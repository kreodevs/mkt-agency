export interface AuditLog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface ListAuditLogsParams {
  tenantId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
