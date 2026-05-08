import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOnboardingDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsString()
  productId?: string;
}
