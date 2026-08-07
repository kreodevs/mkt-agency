import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';

export function assertAssetFileAccess(user: AuthenticatedUser, assetId: string): void {
  if (user.tokenScope === 'asset:read' && user.assetId !== assetId) {
    throw new ForbiddenException({
      error: 'Asset read token does not match this file',
      code: 'FORBIDDEN',
    });
  }
}
