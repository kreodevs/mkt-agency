import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtTokenService } from '../../../shared/auth/jwt-token.service';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import {
  TENANT_REPOSITORY,
  TenantRepositoryPort,
} from '../../tenant/domain/tenant.repository.port';
import { TenantNotFoundException } from '../../tenant/exceptions/tenant-not-found.exception';
import { ImpersonationLoggerService } from '../services/impersonation-logger.service';
import { ImpersonateCommand, ImpersonateResult } from './impersonate.command';

@CommandHandler(ImpersonateCommand)
export class ImpersonateHandler
  implements ICommandHandler<ImpersonateCommand, ImpersonateResult>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenants: TenantRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly jwtTokenService: JwtTokenService,
    private readonly impersonationLogger: ImpersonationLoggerService,
  ) {}

  async execute(command: ImpersonateCommand): Promise<ImpersonateResult> {
    const tenant = await this.tenants.findById(command.tenantId);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    const proxyUser = await this.users.findTenantProxyUser(command.tenantId);
    if (!proxyUser) {
      throw new BadRequestException({
        error: 'El tenant no tiene usuario administrador activo',
        code: 'VALIDATION_ERROR',
      });
    }

    const { accessToken, expiresIn } =
      this.jwtTokenService.signImpersonationToken({
        sub: proxyUser.id,
        email: command.superadmin.email,
        isSuperadmin: false,
        role: proxyUser.role,
        tenantId: command.tenantId,
        impersonating: true,
        superadminId: command.superadmin.id,
      });

    await this.impersonationLogger.log({
      superadminId: command.superadmin.id,
      tenantId: command.tenantId,
      action: 'impersonation_started',
      metadata: { proxyUserId: proxyUser.id },
    });

    return {
      impersonationToken: accessToken,
      expiresIn,
      tenant: { id: tenant.id, name: tenant.name },
      user: {
        id: proxyUser.id,
        name: `${command.superadmin.email} (superadmin)`,
        email: command.superadmin.email,
        role: proxyUser.role,
      },
      note: 'All actions are logged. Destructive actions are prohibited.',
    };
  }
}
