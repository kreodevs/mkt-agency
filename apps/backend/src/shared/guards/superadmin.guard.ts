import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';

@Injectable()
export class SuperadminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user?.isSuperadmin) {
      throw new ForbiddenException({
        error: 'Superadmin access required',
        code: 'FORBIDDEN',
      });
    }

    return true;
  }
}
