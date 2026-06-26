import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCampaignTemplateDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  objective?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsObject()
  budgetDistribution?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  agentConfig?: Record<string, unknown>;
}

export class UpdateCampaignTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  objective?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsObject()
  budgetDistribution?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  agentConfig?: Record<string, unknown>;
}

export class ListCampaignTemplatesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class CreateCampaignDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  objective?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @Type(() => Number)
  totalBudget?: number;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  objective?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @Type(() => Number)
  totalBudget?: number;
}

export class ListCampaignsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class UpdateBudgetDto {
  @IsBoolean()
  approved!: boolean;
}

export class CreateAudienceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAudienceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListAudiencesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
