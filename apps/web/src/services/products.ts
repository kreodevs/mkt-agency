import { apiFetch } from '@/services/api';
import type {
  BulkCreateProductsPayload,
  BulkCreateProductsResponse,
  CompleteProductOnboardingResponse,
  CreateProductPayload,
  ListProductsParams,
  PaginatedProductsResponse,
  Product,
  ProductOnboardingStatus,
  SuggestProductKeywordsResponse,
  UpdateProductPayload,
} from '@/types/product';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<PaginatedProductsResponse> {
  return apiFetch<PaginatedProductsResponse>(
    `/products${buildQuery(params as Record<string, string | number | undefined>)}`,
  );
}

export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  return apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function archiveProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}/archive`, {
    method: 'POST',
  });
}

export async function bulkCreateProducts(
  payload: BulkCreateProductsPayload,
): Promise<BulkCreateProductsResponse> {
  return apiFetch<BulkCreateProductsResponse>('/products/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProductOnboardingStatus(id: string): Promise<ProductOnboardingStatus> {
  return apiFetch<ProductOnboardingStatus>(`/products/${id}/onboarding`);
}

export async function suggestProductKeywords(
  id: string,
  payload: { url: string },
): Promise<SuggestProductKeywordsResponse> {
  return apiFetch<SuggestProductKeywordsResponse>(`/products/${id}/suggest-keywords`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function completeProductOnboarding(
  id: string,
): Promise<CompleteProductOnboardingResponse> {
  return apiFetch<CompleteProductOnboardingResponse>(`/products/${id}/onboarding/complete`, {
    method: 'POST',
  });
}
