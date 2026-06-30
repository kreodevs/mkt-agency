import type { ProductStatus } from '../domain/product.constants';

export class ProductResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  slug!: string;
  description!: string | null;
  category!: string | null;
  priceRange!: string | null;
  targetAudience!: string | null;
  valueProposition!: string | null;
  keywords!: string[];
  status!: ProductStatus;
  isPrimary!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedProductsResponseDto {
  items!: ProductResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class BulkCreateProductsResponseDto {
  created!: ProductResponseDto[];
  skipped!: number;
}
