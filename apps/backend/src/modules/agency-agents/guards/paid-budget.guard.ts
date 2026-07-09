import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';
import { OperatingProfileService } from '../services/operating-profile.service';

/** Bloquea estrategia IA, presupuestos y pauta si el tenant no tiene presupuesto ads activo. */
@Injectable()
export class PaidBudgetGuard implements CanActivate {
  constructor(private readonly operatingProfile: OperatingProfileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user?.tenantId) {
      throw new ForbiddenException({ error: 'Tenant context required', code: 'FORBIDDEN' });
    }

    const profile = await this.operatingProfile.getProfile(user.tenantId);
    if (!this.operatingProfile.isPaidCapable(profile)) {
      throw new ForbiddenException({
        error: 'La pauta pagada requiere perfil Growth con presupuesto mensual configurado',
        code: 'PAID_BUDGET_REQUIRED',
      });
    }

    return true;
  }
}
