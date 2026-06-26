import { HttpException, HttpStatus, Inject } from '@nestjs/common';
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
    if (command.superadmin.impersonating) {
      throw new HttpException(
        {
          error: 'Superadmin is already impersonating a tenant',
          code: 'CONFLICT',
        },
        HttpStatus.CONFLICT,
      );
    }

    const tenant = await this.tenants.findById(command.tenantId);
    if (!tenant) {
      throw new TenantNotFoundException();
    }

    const targetUser = await this.users.findPublicByIdAndTenant(
      command.userId,
      command.tenantId,
    );

    if (!targetUser) {
      throw new HttpException(
        { error: 'User not found in tenant', code: 'NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    }

    const { accessToken, expiresIn } =
      this.jwtTokenService.signImpersonationToken({
        sub: targetUser.id,
        email: targetUser.email,
        isSuperadmin: false,
        role: targetUser.role,
        tenantId: targetUser.tenantId,
        impersonating: true,
        superadminId: command.superadmin.id,
      });

    await this.impersonationLogger.log({
      superadminId: command.superadmin.id,
      tenantId: command.tenantId,
      action: 'impersonation_started',
      metadata: { userId: targetUser.id },
    });

    return {
      impersonationToken: accessToken,
      expiresIn,
      tenant: { id: tenant.id, name: tenant.name },
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
      note: 'All actions are logged. Destructive actions are prohibited.',
    };
  }
}
