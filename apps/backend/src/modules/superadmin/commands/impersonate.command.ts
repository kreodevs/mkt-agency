import { AuthenticatedUser } from '../../../shared/auth/jwt-payload.interface';

export class ImpersonateCommand {
  constructor(
    public readonly superadmin: AuthenticatedUser,
    public readonly tenantId: string,
    public readonly userId: string,
  ) {}
}

export interface ImpersonateResult {
  impersonationToken: string;
  expiresIn: number;
  tenant: { id: string; name: string };
  user: { id: string; name: string; email: string };
  note: string;
}
