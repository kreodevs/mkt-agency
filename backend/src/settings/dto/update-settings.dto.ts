import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BrandAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  xApiKey?: string;

  @IsOptional()
  @IsString()
  xApiSecret?: string;

  @IsOptional()
  @IsString()
  xAccessToken?: string;

  @IsOptional()
  @IsString()
  xAccessSecret?: string;

  @IsOptional()
  @IsString()
  googleAdsDeveloperToken?: string;

  @IsOptional()
  @IsString()
  googleAdsClientId?: string;

  @IsOptional()
  @IsString()
  googleAdsClientSecret?: string;

  @IsOptional()
  @IsString()
  whatsappPhoneNumberId?: string;

  @IsOptional()
  @IsString()
  whatsappToken?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrandAssetDto)
  brandAssets?: { name: string; url: string; type: string }[];
}
