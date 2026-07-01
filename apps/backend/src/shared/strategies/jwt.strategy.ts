import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../auth/jwt-payload.interface';
import { JwtTokenService } from '../auth/jwt-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(jwtTokenService: JwtTokenService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: { query?: { access_token?: string | string[] } }) => {
          const token = request?.query?.access_token;
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtTokenService.getPublicKeyPem(),
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      isSuperadmin: payload.isSuperadmin,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
      impersonating: payload.impersonating ?? false,
      superadminId: payload.superadminId ?? null,
    };
  }
}
