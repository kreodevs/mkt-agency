export const PRODUCT_LOGO_ASSET_ID_KEY = 'logoAssetId';
export const PRODUCT_LOGO_SOURCE_URL_KEY = 'logoSourceUrl';

export function getProductLogoAssetId(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.[PRODUCT_LOGO_ASSET_ID_KEY];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getProductLogoSourceUrl(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.[PRODUCT_LOGO_SOURCE_URL_KEY];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function withProductLogoMetadata(
  metadata: Record<string, unknown>,
  logoAssetId: string,
  logoSourceUrl?: string | null,
): Record<string, unknown> {
  return {
    ...metadata,
    [PRODUCT_LOGO_ASSET_ID_KEY]: logoAssetId,
    ...(logoSourceUrl ? { [PRODUCT_LOGO_SOURCE_URL_KEY]: logoSourceUrl } : {}),
  };
}

export function withoutProductLogoMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const next = { ...metadata };
  delete next[PRODUCT_LOGO_ASSET_ID_KEY];
  delete next[PRODUCT_LOGO_SOURCE_URL_KEY];
  return next;
}
