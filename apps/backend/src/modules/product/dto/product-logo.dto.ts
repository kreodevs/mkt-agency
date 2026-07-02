export class ProductLogoResponseDto {
  logoAssetId!: string | null;
  logoUrl!: string | null;
  logoSourceUrl!: string | null;
  synced!: boolean;
}

export class SyncProductLogoFromWebsiteDto {
  url?: string;
}
