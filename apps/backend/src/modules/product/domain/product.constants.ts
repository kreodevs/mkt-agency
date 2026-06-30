export const PRODUCT_STATUSES = ['active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CATEGORIES = [
  'physical',
  'digital',
  'service',
  'subscription',
  'other',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CAMPAIGN_SCOPES = ['product', 'brand'] as const;
export type CampaignScope = (typeof CAMPAIGN_SCOPES)[number];
