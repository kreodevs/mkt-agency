import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
      .user;

    if (!user?.tenantId) {
      throw new ForbiddenException({
        error: 'Tenant context required',
        code: 'FORBIDDEN',
      });
    }

    if (user.isSuperadmin && !user.impersonating) {
      throw new ForbiddenException({
        error: 'Tenant operations require impersonation for superadmin',
        code: 'FORBIDDEN',
      });
    }

    return true;
  }
}
