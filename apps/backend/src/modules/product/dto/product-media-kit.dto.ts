import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PRODUCT_MEDIA_ROLES } from '../domain/product-media-kit.constants';

export class AddProductMediaKitItemDto {
  @IsUUID()
  assetId!: string;

  @IsIn(PRODUCT_MEDIA_ROLES)
  role!: (typeof PRODUCT_MEDIA_ROLES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}

export class ProductMediaKitItemResponseDto {
  id!: string;
  productId!: string;
  assetId!: string;
  role!: string;
  label!: string | null;
  sortOrder!: number;
  assetName!: string;
  assetType!: string;
  mimeType!: string | null;
  url!: string | null;
  createdAt!: string;
}

export class ProductMediaKitListResponseDto {
  items!: ProductMediaKitItemResponseDto[];
  total!: number;
}
