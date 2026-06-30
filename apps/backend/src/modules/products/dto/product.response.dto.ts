export class ProductResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  description!: string | null;
  website!: string | null;
  seoTags!: Record<string, string[]> | null;
  createdAt!: string;
  updatedAt!: string;
}

export class ProductListResponseDto {
  items!: ProductResponseDto[];
}