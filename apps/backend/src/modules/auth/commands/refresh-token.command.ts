export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress: string | null = null,
  ) {}
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
