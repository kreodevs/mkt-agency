export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ipAddress: string | null = null,
  ) {}
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string | null;
    isSuperadmin: boolean;
    role: string;
  };
}
