import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAssetsSize!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxFileSize!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCampaigns?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAiRequestsPerDay?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdatePackageRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCampaigns?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAiRequestsPerDay?: number | null;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
