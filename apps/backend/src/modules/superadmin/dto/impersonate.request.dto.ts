import { IsUUID } from 'class-validator';

export class ImpersonateRequestDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  userId!: string;
}
