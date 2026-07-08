import { apiFetch, API_BASE } from '@/services/api';
import { getAccessToken } from '@/store/auth';
import type {
  BulkCreateProductsPayload,
  BulkCreateProductsResponse,
  CompleteProductOnboardingResponse,
  CreateProductPayload,
  ListProductsParams,
  PaginatedProductsResponse,
  Product,
  ProductLogoResponse,
  ProductMediaKitItem,
  ProductMediaKitListResponse,
  ProductMediaRole,
  ProductOnboardingStatus,
  InferProductFromPageResponse,
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

export async function inferProductFromPage(
  id: string,
  payload: { url: string },
): Promise<InferProductFromPageResponse> {
  return apiFetch<InferProductFromPageResponse>(`/products/${id}/infer-from-page`, {
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

/** Crea un producto mínimo con una URL, infiere datos por IA, y devuelve el producto creado. */
export async function createProductFromUrl(payload: {
  url: string;
}): Promise<Product> {
  // Paso 1: crear producto mínimo
  const product = await apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Nuevo producto',
      category: 'service',
      isPrimary: true,
      websiteUrl: payload.url.trim(),
    }),
  });

  // Paso 2: inferir campos desde la URL
  await inferProductFromPage(product.id, { url: payload.url.trim() });

  // El frontend del wizard recarga el producto, así no necesitamos return con data.
  return product;
}

export async function syncProductLogoFromWebsite(
  id: string,
  payload: { url?: string } = {},
): Promise<ProductLogoResponse> {
  return apiFetch<ProductLogoResponse>(`/products/${id}/logo/from-website`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function uploadProductLogo(productId: string, file: File): Promise<ProductLogoResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as ProductLogoResponse);
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(body.error ?? 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.open('POST', `${API_BASE}/products/${productId}/logo`);
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export async function removeProductLogo(id: string): Promise<ProductLogoResponse> {
  return apiFetch<ProductLogoResponse>(`/products/${id}/logo`, {
    method: 'DELETE',
  });
}

export async function listProductMediaKit(productId: string): Promise<ProductMediaKitListResponse> {
  return apiFetch<ProductMediaKitListResponse>(`/products/${productId}/media-kit`);
}

export function uploadProductMediaKit(
  productId: string,
  file: File,
  role: ProductMediaRole,
  label?: string,
): Promise<ProductMediaKitItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ role });
    if (label?.trim()) {
      params.set('label', label.trim());
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as ProductMediaKitItem);
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        reject(new Error(body.error ?? 'Upload failed'));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.open('POST', `${API_BASE}/products/${productId}/media-kit/upload?${params.toString()}`);
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export async function linkProductMediaKit(
  productId: string,
  payload: { assetId: string; role: ProductMediaRole; label?: string },
): Promise<ProductMediaKitItem> {
  return apiFetch<ProductMediaKitItem>(`/products/${productId}/media-kit/link`, {
    method: 'POST',
    body: JSON.stringify({
      assetId: payload.assetId,
      role: payload.role,
      label: payload.label?.trim() || undefined,
    }),
  });
}

export async function removeProductMediaKitItem(productId: string, itemId: string): Promise<void> {
  await apiFetch<void>(`/products/${productId}/media-kit/${itemId}`, {
    method: 'DELETE',
  });
}
