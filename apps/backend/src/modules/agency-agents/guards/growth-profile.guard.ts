import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';
import { OperatingProfileService } from '../services/operating-profile.service';

/** Bloquea endpoints de campaña/agencia completa para perfil SOHO. */
@Injectable()
export class GrowthProfileGuard implements CanActivate {
  constructor(private readonly operatingProfile: OperatingProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user?.tenantId) {
      throw new ForbiddenException({ error: 'Tenant context required', code: 'FORBIDDEN' });
    }

    const profile = await this.operatingProfile.getProfile(user.tenantId);
    if (!this.operatingProfile.isGrowthProfile(profile)) {
      throw new ForbiddenException({
        error: 'Esta función requiere perfil Growth. Actívala en Ajustes del copiloto.',
        code: 'SOHO_PROFILE',
      });
    }

    return true;
  }
}
