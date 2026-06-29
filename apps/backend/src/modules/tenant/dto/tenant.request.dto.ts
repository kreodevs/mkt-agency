import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ALLOWED_TENANT_PLANS,
  ALLOWED_TENANT_STATUSES,
} from '../domain/tenant.constants';

export class UpdateTenantRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn([...ALLOWED_TENANT_PLANS])
  plan?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsIn([...ALLOWED_TENANT_STATUSES])
  status?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAssetsSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxFileSize?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  platformAdminIds?: string[];
}

export class ListTenantsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_TENANT_STATUSES])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_TENANT_PLANS])
  plan?: string;
}
