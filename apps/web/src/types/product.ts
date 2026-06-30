export type ProductStatus = 'active' | 'archived';

export type ProductCategory = 'physical' | 'digital' | 'service' | 'subscription' | 'other';

export type CampaignScope = 'product' | 'brand';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory | string | null;
  priceRange: string | null;
  targetAudience: string | null;
  valueProposition: string | null;
  keywords: string[];
  status: ProductStatus;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  status?: ProductStatus;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  category?: ProductCategory;
  priceRange?: string;
  targetAudience?: string;
  valueProposition?: string;
  keywords?: string[];
  isPrimary?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  category?: ProductCategory;
  priceRange?: string;
  targetAudience?: string;
  valueProposition?: string;
  keywords?: string[];
  status?: ProductStatus;
  isPrimary?: boolean;
}

export interface BulkCreateProductsPayload {
  names: string[];
  defaultTargetAudience?: string;
  defaultValueProposition?: string;
  markFirstAsPrimary?: boolean;
}

export interface BulkCreateProductsResponse {
  created: Product[];
  skipped: number;
}
