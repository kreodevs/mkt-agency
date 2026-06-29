export interface ImpersonateResponse {
  impersonationToken: string;
  expiresIn: number;
  tenant: { id: string; name: string };
  user: { id: string; name: string; email: string; role: string };
  note: string;
}
