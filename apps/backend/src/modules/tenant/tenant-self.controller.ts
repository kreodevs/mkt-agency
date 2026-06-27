import { Controller, ForbiddenException, Get } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantLimitsSnapshot } from '../packages/domain/tenant-limits.types';
import { TenantLimitsService } from '../packages/services/tenant-limits.service';

@Controller('tenant')
export class TenantSelfController {
  constructor(private readonly tenantLimitsService: TenantLimitsService) {}

  @Get('limits')
  getLimits(@CurrentUser() user: AuthenticatedUser): Promise<TenantLimitsSnapshot> {
    if (!user.tenantId) {
      throw new ForbiddenException({
        error: 'Tenant context required',
        code: 'FORBIDDEN',
      });
    }

    return this.tenantLimitsService.getSnapshot(user.tenantId);
  }
}
