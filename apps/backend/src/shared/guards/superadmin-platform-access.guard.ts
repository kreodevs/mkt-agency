import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';

/**
 * Consola de plataforma: superadmin nativo o sesión de impersonación auditada
 * (JWT con `superadminId`). Solo para lecturas de consola (p. ej. listar tenants).
 */
@Injectable()
export class SuperadminPlatformAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (user?.isSuperadmin && !user.impersonating) {
      return true;
    }

    if (user?.impersonating && user.superadminId) {
      return true;
    }

    throw new ForbiddenException({
      error: 'Superadmin access required',
      code: 'FORBIDDEN',
    });
  }
}
