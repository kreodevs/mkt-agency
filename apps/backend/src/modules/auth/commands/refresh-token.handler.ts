import { HttpException, HttpStatus, Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtTokenService } from '../../../shared/auth/jwt-token.service';
import {
  generateRefreshToken,
  hashRefreshToken,
} from '../../../shared/crypto/token.util';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../shared/domain/user.repository.port';
import { SecurityEventRecorderService } from '../../security/services/security-event-recorder.service';
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../domain/session.repository.port';
import {
  RefreshTokenCommand,
  RefreshTokenResult,
} from './refresh-token.command';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult>
{
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    private readonly jwtTokenService: JwtTokenService,
    private readonly securityEvents: SecurityEventRecorderService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const hash = hashRefreshToken(command.refreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (!session) {
      const reused = await this.sessions.findReuseByPreviousHash(hash);
      if (reused) {
        await this.sessions.deleteAllForUser(reused.userId);
        await this.securityEvents.record({
          eventType: 'refresh_token_reuse',
          severity: 'critical',
          userId: reused.userId,
          metadata: { sessionId: reused.id },
          ipAddress: command.ipAddress,
        });

        throw new HttpException(
          {
            error:
              'Refresh token already used. All sessions invalidated for security.',
            code: 'TOKEN_REUSE_DETECTED',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new UnauthorizedException({
        error: 'Invalid or expired refresh token',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessions.deleteById(session.id);
      throw new UnauthorizedException({
        error: 'Invalid or expired refresh token',
        code: 'TOKEN_EXPIRED',
      });
    }

    const user = await this.users.findPublicById(session.userId);
    if (!user) {
      await this.sessions.deleteById(session.id);
      throw new UnauthorizedException({
        error: 'Invalid or expired refresh token',
        code: 'TOKEN_EXPIRED',
      });
    }

    const newRefreshToken = generateRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.sessions.rotateRefreshToken(
      session.id,
      newHash,
      newExpiresAt,
      hash,
    );

    const { accessToken, expiresIn } = this.jwtTokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      isSuperadmin: user.isSuperadmin,
      role: user.role,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }
}
