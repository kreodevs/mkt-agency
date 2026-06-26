import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';

const DESTRUCTIVE_ACTIONS = new Set([
  'delete_tenant',
  'delete_asset',
  'delete_campaign',
  'delete_user',
]);

export class ImpersonationPolicy {
  static assertDestructiveAllowed(
    user: AuthenticatedUser,
    action: string,
  ): void {
    if (!user.impersonating) {
      return;
    }

    if (DESTRUCTIVE_ACTIONS.has(action)) {
      throw new ForbiddenException({
        error: 'Destructive actions are prohibited during impersonation',
        code: 'FORBIDDEN',
      });
    }
  }
}
