import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import { exportJWK, importSPKI } from 'jose';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './jwt-payload.interface';

const ACCESS_TOKEN_TTL_SECONDS = 900;
const ASSET_READ_TOKEN_TTL_SECONDS = 300;
const IMPERSONATION_TOKEN_TTL_SECONDS = 3600;
const KEY_ID = 'mkt-agency-key-1';

@Injectable()
export class JwtTokenService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor(configService: ConfigService) {
    const privateKeyPem = configService.get<string>('JWT_PRIVATE_KEY_PEM');
    const publicKeyPem = configService.get<string>('JWT_PUBLIC_KEY_PEM');

    if (privateKeyPem && publicKeyPem) {
      this.privateKey = privateKeyPem.replace(/\\n/g, '\n');
      this.publicKey = publicKeyPem.replace(/\\n/g, '\n');
      return;
    }

    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = pair.privateKey;
    this.publicKey = pair.publicKey;
  }

  signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
    accessToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      keyid: KEY_ID,
    });

    return { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }

  signAssetReadToken(tenantId: string, assetId: string): {
    accessToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(
      {
        sub: 'asset-read',
        email: 'asset-read@internal',
        role: 'member',
        isSuperadmin: false,
        tenantId,
        scope: 'asset:read',
        assetId,
      } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
      this.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: ASSET_READ_TOKEN_TTL_SECONDS,
        keyid: KEY_ID,
      },
    );

    return { accessToken, expiresIn: ASSET_READ_TOKEN_TTL_SECONDS };
  }

  signImpersonationToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
    accessToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: IMPERSONATION_TOKEN_TTL_SECONDS,
      keyid: KEY_ID,
    });

    return {
      accessToken,
      expiresIn: IMPERSONATION_TOKEN_TTL_SECONDS,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException({
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED',
      });
    }
  }

  getPublicKeyPem(): string {
    return this.publicKey;
  }

  async getJwks(): Promise<{ keys: Record<string, unknown>[] }> {
    const key = await importSPKI(this.publicKey, 'RS256');
    const jwk = await exportJWK(key);

    return {
      keys: [
        {
          ...jwk,
          kid: KEY_ID,
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }
}
