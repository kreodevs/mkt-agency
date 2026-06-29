import { HttpException, HttpStatus, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtTokenService } from '../../../shared/auth/jwt-token.service';
import {
  generateRefreshToken,
  hashRefreshToken,
} from '../../../shared/crypto/token.util';
import { Password } from '../../../shared/domain/password.value-object';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import { SecurityEventRecorderService } from '../../security/services/security-event-recorder.service';
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../domain/session.repository.port';
import { LoginCommand, LoginResult } from './login.command';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepositoryPort,
    private readonly jwtTokenService: JwtTokenService,
    private readonly securityEvents: SecurityEventRecorderService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = command.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user) {
      await this.securityEvents.record({
        eventType: 'login_failed',
        severity: 'medium',
        metadata: { email },
        ipAddress: command.ipAddress,
      });
      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      });
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new HttpException(
        {
          error:
            'Account locked due to multiple failed attempts. Try again in 15 minutes.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.lockedUntil.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      });
    }

    if (user.tenantStatus === 'suspended' || user.tenantStatus === 'deleted') {
      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      });
    }

    const passwordValid = await Password.verify(
      command.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      const attempts = await this.users.incrementLoginAttempts(user.id);

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await this.users.lockUntil(user.id, lockedUntil);
        await this.securityEvents.record({
          eventType: 'account_locked',
          severity: 'high',
          userId: user.id,
          tenantId: this.securityTenantId(user),
          metadata: { attempts },
          ipAddress: command.ipAddress,
        });
      } else {
        await this.securityEvents.record({
          eventType: 'login_failed',
          severity: 'medium',
          userId: user.id,
          tenantId: this.securityTenantId(user),
          metadata: { attempts },
          ipAddress: command.ipAddress,
        });
      }

      throw new UnauthorizedException({
        error: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      });
    }

    if (Password.isLegacyHash(user.passwordHash)) {
      const upgraded = await Password.upgradeFromPlaintext(command.password);
      await this.users.updatePasswordHash(user.id, upgraded.toHash());
    }

    const tenantId = this.resolveAccessTokenTenantId(user);

    await this.users.resetLoginAttempts(user.id);

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.sessions.create({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    });

    const { accessToken, expiresIn } = this.jwtTokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId,
        isSuperadmin: user.isSuperadmin,
        role: user.role,
      },
    };
  }

  private securityTenantId(user: {
    isSuperadmin: boolean;
    tenantId: string | null;
  }): string | null {
    return user.isSuperadmin ? null : user.tenantId;
  }

  private resolveAccessTokenTenantId(user: {
    isSuperadmin: boolean;
    tenantId: string | null;
  }): string | null {
    if (user.isSuperadmin) {
      return null;
    }

    return user.tenantId;
  }
}
