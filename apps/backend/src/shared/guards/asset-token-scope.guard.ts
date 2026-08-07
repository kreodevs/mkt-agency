import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const ASSET_FILE_PATH =
  /^\/api\/v1\/assets\/[0-9a-f-]{36}\/(file|thumbnail)$/i;

@Injectable()
export class AssetTokenScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      method?: string;
      originalUrl?: string;
      path?: string;
    }>();
    const user = request.user;

    if (!user || user.tokenScope !== 'asset:read') {
      return true;
    }

    const path = (request.originalUrl ?? request.path ?? '').split('?')[0] ?? '';
    if (request.method === 'GET' && ASSET_FILE_PATH.test(path)) {
      return true;
    }

    throw new ForbiddenException({
      error: 'Asset read token cannot access this resource',
      code: 'FORBIDDEN',
    });
  }
}
