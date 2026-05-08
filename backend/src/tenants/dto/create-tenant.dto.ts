import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}