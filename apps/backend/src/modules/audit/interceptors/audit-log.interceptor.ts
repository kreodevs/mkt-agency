import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';
import { AuditLogRecorderService } from '../../users/services/audit-log-recorder.service';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogs: AuditLogRecorderService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditLogMetadata | undefined>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      ip?: string;
      params?: Record<string, string>;
    }>();

    const user = request.user;
    const resourceId = metadata.resourceIdParam
      ? request.params?.[metadata.resourceIdParam]
      : undefined;

    return next.handle().pipe(
      tap(() => {
        void this.auditLogs.record({
          tenantId: user?.tenantId ?? null,
          userId: user?.id ?? null,
          action: metadata.action,
          resourceType: metadata.resourceType,
          resourceId,
          ipAddress: request.ip ?? null,
        });
      }),
    );
  }
}
