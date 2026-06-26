import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  brandVoice?: string;

  @IsOptional()
  @IsString()
  targetAudienceDesc?: string;

  @IsOptional()
  @IsString()
  competitors?: string;

  @IsOptional()
  @IsArray()
  objectives?: unknown[];

  @IsOptional()
  @IsObject()
  visualPreferences?: Record<string, unknown>;
}
