import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  AppCaptureViewport,
  ProductAppCaptureScreen,
} from '../domain/product-app-capture.metadata.util';

export class ProductAppCaptureScreenDto implements ProductAppCaptureScreen {
  @IsString()
  @MaxLength(200)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  path?: string;

  @IsOptional()
  @IsIn(['desktop', 'mobile', 'tablet'])
  viewport?: AppCaptureViewport;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30_000)
  waitMs?: number;
}

export class UpdateProductAppCaptureDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  loginUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  appUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  emailSelector?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  passwordSelector?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  submitSelector?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30_000)
  postLoginWaitMs?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProductAppCaptureScreenDto)
  screens?: ProductAppCaptureScreenDto[];

  @IsOptional()
  @IsBoolean()
  autoCaptureBeforeGenerate?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  manifestUrl?: string;
}

export class ProductAppCaptureResponseDto {
  enabled!: boolean;
  loginUrl!: string | null;
  appUrl!: string | null;
  email!: string | null;
  hasPassword!: boolean;
  password!: string | null;
  emailSelector!: string | null;
  passwordSelector!: string | null;
  submitSelector!: string | null;
  postLoginWaitMs!: number;
  screens!: ProductAppCaptureScreen[];
  autoCaptureBeforeGenerate!: boolean;
  configured!: boolean;
  lastCaptureAt!: string | null;
  lastCaptureStatus!: 'success' | 'failed' | null;
  lastCaptureError!: string | null;
  lastCaptureCount!: number;
  screenshotCountInKit!: number;
  manifestUrl!: string | null;
  resolvedManifestUrl!: string | null;
  manifestUrlConfigured!: boolean;
  usesTutorialManifest!: boolean;
}

export class ProductAppCaptureRunResponseDto {
  status!: 'success' | 'failed';
  capturedCount!: number;
  items!: Array<{ id: string; label: string | null; assetId: string }>;
  error?: string;
}
