import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserBySuperadminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'suspended', 'inactive'])
  status?: string;
}