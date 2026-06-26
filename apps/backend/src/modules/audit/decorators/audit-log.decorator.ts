import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: string;
  resourceType?: string;
  resourceIdParam?: string;
}

export const AuditLog = (metadata: AuditLogMetadata): MethodDecorator & ClassDecorator =>
  SetMetadata(AUDIT_LOG_KEY, metadata);
