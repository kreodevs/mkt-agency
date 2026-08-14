import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import type { BrandVisualStyle } from '../domain/brand-visual-kit.metadata.util';

const BRAND_STYLES = ['minimal', 'bold', 'luxury'] as const;

export class UpdateBrandVisualKitDto {
  @IsOptional()
  @IsIn(BRAND_STYLES)
  style?: BrandVisualStyle;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  accentColor?: string;
}

export class BrandVisualKitResponseDto {
  style!: BrandVisualStyle;
  primaryColor!: string;
  secondaryColor!: string;
  accentColor!: string;
  updatedAt!: string | null;
}
