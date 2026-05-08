import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  token: string;

  @Expose()
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    tenants: { id: string; name: string; role: string; products: { id: string; name: string; type: string }[] }[];
  };
}