import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import type {
  ProductPlatformCredential,
  ProductPlatformWebhookOverride,
} from '../domain/product-publish-integration.metadata.util';

export class ProductPlatformWebhookOverrideDto implements ProductPlatformWebhookOverride {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ProductPlatformCredentialDto implements ProductPlatformCredential {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  accountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  accessToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  refreshToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateProductPublishIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  regenerateSecret?: boolean;

  @IsOptional()
  @IsBoolean()
  autoDispatchOnReady?: boolean;

  @IsOptional()
  @IsObject()
  webhooksByPlatform?: Record<string, ProductPlatformWebhookOverrideDto>;

  @IsOptional()
  @IsObject()
  credentialsByPlatform?: Record<string, ProductPlatformCredentialDto>;
}

export class ProductPublishIntegrationResponseDto {
  enabled!: boolean;
  webhookUrl!: string | null;
  hasWebhookSecret!: boolean;
  webhookSecret!: string | null;
  autoDispatchOnReady!: boolean;
  webhooksByPlatform!: Record<string, ProductPlatformWebhookOverride>;
  credentialsByPlatform!: Record<string, ProductPlatformCredential>;
  callbackPath!: string;
  configured!: boolean;
}
