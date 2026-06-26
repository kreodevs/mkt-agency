import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../../../shared/decorators/public.decorator';
import { RateLimitTier } from '../domain/rate-limit.constants';
import { RateLimitService } from '../services/rate-limit.service';

const AI_PATH_PATTERN =
  /\/(proposals|reports)(\/|$)|\/suggest|\/generate-strategy/;

function resolveTier(
  request: Request,
  user: AuthenticatedUser | undefined,
  isPublic: boolean,
): RateLimitTier {
  const path = request.originalUrl.split('?')[0] ?? request.path;

  if (request.method === 'POST' && AI_PATH_PATTERN.test(path)) {
    return 'ai';
  }

  if (user && !isPublic) {
    return 'auth';
  }

  return 'public';
}

function resolveIdentifier(request: Request, user: AuthenticatedUser | undefined): string {
  if (user?.id) {
    return `user:${user.id}`;
  }

  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return `ip:${forwarded.split(',')[0]?.trim() ?? 'unknown'}`;
  }

  return `ip:${request.ip ?? 'unknown'}`;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const tier = resolveTier(request, request.user, Boolean(isPublic));
    const identifier = resolveIdentifier(request, request.user);

    try {
      await this.rateLimitService.assertWithinLimit(tier, identifier);
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }
}
