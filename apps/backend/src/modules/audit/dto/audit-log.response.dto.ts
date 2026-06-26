export class AuditLogResponseDto {
  id!: string;
  tenantId!: string | null;
  userId!: string | null;
  action!: string;
  resourceType!: string | null;
  resourceId!: string | null;
  details!: Record<string, unknown>;
  ipAddress!: string | null;
  createdAt!: string;
}

export class PaginatedAuditLogsResponseDto {
  items!: AuditLogResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
