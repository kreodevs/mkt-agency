import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProductLogoResponseDto {
  logoAssetId!: string | null;
  logoUrl!: string | null;
  logoSourceUrl!: string | null;
  synced!: boolean;
}

export class SyncProductLogoFromWebsiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;
}
