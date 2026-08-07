import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { ImpersonationPolicy } from '../../modules/superadmin/domain/impersonation-policy';

const DESTRUCTIVE_POST_PATH =
  /\/(purge|bulk-delete|delete\/|regenerate-secret|rotate)$/i;

@Injectable()
export class ImpersonationDestructiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      method?: string;
      originalUrl?: string;
      path?: string;
    }>();
    const user = request.user;

    if (!user?.impersonating) {
      return true;
    }

    const path = (request.originalUrl ?? request.path ?? '').split('?')[0] ?? '';

    if (request.method === 'DELETE') {
      ImpersonationPolicy.assertDestructiveAllowed(user, 'delete_asset');
      return true;
    }

    if (request.method === 'POST' && DESTRUCTIVE_POST_PATH.test(path)) {
      ImpersonationPolicy.assertDestructiveAllowed(user, 'delete_asset');
    }

    return true;
  }
}
