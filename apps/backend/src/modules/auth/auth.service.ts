import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtTokenService } from '../../shared/auth/jwt-token.service';
import { hashRefreshToken } from '../../shared/crypto/token.util';
import { LoginCommand, LoginResult } from './commands/login.command';
import {
  RefreshTokenCommand,
  RefreshTokenResult,
} from './commands/refresh-token.command';
import {
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
} from './dto/auth.request.dto';
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from './domain/session.repository.port';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepositoryPort,
  ) {}

  login(body: LoginRequestDto, ipAddress: string | null): Promise<LoginResult> {
    return this.commandBus.execute<LoginCommand, LoginResult>(
      new LoginCommand(body.email, body.password, ipAddress),
    );
  }

  refresh(
    body: RefreshTokenRequestDto,
    ipAddress: string | null,
  ): Promise<RefreshTokenResult> {
    return this.commandBus.execute<RefreshTokenCommand, RefreshTokenResult>(
      new RefreshTokenCommand(body.refreshToken, ipAddress),
    );
  }

  async logout(body: LogoutRequestDto): Promise<{ message: string }> {
    const hash = hashRefreshToken(body.refreshToken);
    const session = await this.sessions.findByRefreshTokenHash(hash);

    if (session) {
      await this.sessions.deleteById(session.id);
    }

    return { message: 'Logged out successfully' };
  }

  getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
    return this.jwtTokenService.getJwks();
  }
}
