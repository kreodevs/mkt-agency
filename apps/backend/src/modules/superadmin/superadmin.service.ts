import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { JwtTokenService } from '../../shared/auth/jwt-token.service';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../shared/domain/user.repository.port';
import {
  ImpersonateCommand,
  ImpersonateResult,
} from './commands/impersonate.command';
import { ImpersonateRequestDto } from './dto/impersonate.request.dto';
import { ImpersonationLoggerService } from './services/impersonation-logger.service';

@Injectable()
export class SuperadminService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly impersonationLogger: ImpersonationLoggerService,
  ) {}

  impersonate(
    superadmin: AuthenticatedUser,
    body: ImpersonateRequestDto,
  ): Promise<ImpersonateResult> {
    return this.commandBus.execute<ImpersonateCommand, ImpersonateResult>(
      new ImpersonateCommand(superadmin, body.tenantId, body.userId),
    );
  }

  async endImpersonation(user: AuthenticatedUser): Promise<{
    message: string;
    sessionToken: string;
  }> {
    if (!user.impersonating || !user.superadminId) {
      throw new ForbiddenException({
        error: 'Not currently impersonating',
        code: 'FORBIDDEN',
      });
    }

    const superadmin = await this.users.findPublicById(user.superadminId);
    if (!superadmin?.isSuperadmin) {
      throw new ForbiddenException({
        error: 'Not currently impersonating',
        code: 'FORBIDDEN',
      });
    }

    await this.impersonationLogger.log({
      superadminId: superadmin.id,
      tenantId: user.tenantId!,
      action: 'impersonation_ended',
      metadata: { impersonatedUserId: user.id },
    });

    const { accessToken } = this.jwtTokenService.signAccessToken({
      sub: superadmin.id,
      email: superadmin.email,
      isSuperadmin: true,
      role: superadmin.role,
      tenantId: null,
    });

    return {
      message: 'Impersonation ended. Audit log recorded.',
      sessionToken: accessToken,
    };
  }
}
