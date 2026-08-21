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
  websiteUrl: string | null;
  keywords: string[];
  status: ProductStatus;
  isPrimary: boolean;
  onboardingCompletionPercentage?: number;
  onboardingReady?: boolean;
  onboardingCompleted?: boolean;
  logoAssetId?: string | null;
  logoUrl?: string | null;
  logoSourceUrl?: string | null;
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
  websiteUrl?: string;
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
  websiteUrl?: string;
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

export interface InferProductFromPageResponse {
  sourceUrl: string;
  inferredFromPage: boolean;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  valueProposition?: string | null;
  targetAudience?: string | null;
  priceRange?: string | null;
  keywords?: string[];
}

export interface ProductOnboardingFieldStatus {
  key: string;
  label: string;
  complete: boolean;
  required: boolean;
}

export interface ProductOnboardingStatus {
  productId: string;
  productName: string;
  completionPercentage: number;
  ready: boolean;
  completed: boolean;
  missingFields: string[];
  fields: ProductOnboardingFieldStatus[];
}

export interface SuggestProductKeywordsResponse {
  keywords: string[];
  sourceUrl?: string | null;
  generatedFromPage: boolean;
}

export interface ProductLogoResponse {
  logoAssetId: string | null;
  logoUrl: string | null;
  logoSourceUrl: string | null;
  synced: boolean;
}

export const PRODUCT_MEDIA_ROLES = [
  'product-screenshot',
  'product-demo',
  'event-photo',
  'team-photo',
  'testimonial',
  'b-roll',
  'other',
] as const;

export type ProductMediaRole = (typeof PRODUCT_MEDIA_ROLES)[number];

export const PRODUCT_MEDIA_ROLE_LABELS: Record<ProductMediaRole, string> = {
  'product-screenshot': 'Captura de producto / app',
  'product-demo': 'Video demo del producto',
  'event-photo': 'Foto de evento o taller',
  'team-photo': 'Foto del equipo',
  testimonial: 'Testimonial',
  'b-roll': 'B-roll del nicho',
  other: 'Otro',
};

export interface ProductMediaKitItem {
  id: string;
  productId: string;
  assetId: string;
  role: ProductMediaRole;
  label: string | null;
  sortOrder: number;
  assetName: string;
  assetType: string;
  mimeType: string | null;
  url: string | null;
  createdAt: string;
}

export interface ProductMediaKitListResponse {
  items: ProductMediaKitItem[];
  total: number;
}

export interface ProductOnboardingAgentsResult {
  brandInterviewId?: string | null;
  competitorAnalysisId?: string | null;
  communityManagerBatchId?: string | null;
  competitorsDiscovered?: number;
  skippedAgents?: string[];
  warnings?: string[];
  processing?: boolean;
}

export interface CompleteProductOnboardingResponse {
  product: {
    id: string;
    name: string;
    onboardingCompleted: boolean;
    completionPercentage: number;
  };
  agents: ProductOnboardingAgentsResult;
}

export interface ProductPlatformWebhookOverride {
  url?: string;
  enabled?: boolean;
}

export interface ProductPlatformCredential {
  accountId?: string;
  pageId?: string;
  accessToken?: string;
  refreshToken?: string;
  notes?: string;
}

export interface ProductPublishIntegration {
  enabled: boolean;
  webhookUrl: string | null;
  hasWebhookSecret: boolean;
  webhookSecret: string | null;
  autoDispatchOnReady: boolean;
  webhooksByPlatform: Record<string, ProductPlatformWebhookOverride>;
  credentialsByPlatform: Record<string, ProductPlatformCredential>;
  callbackPath: string;
  configured: boolean;
}

export interface UpdateProductPublishIntegrationPayload {
  enabled?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  regenerateSecret?: boolean;
  autoDispatchOnReady?: boolean;
  webhooksByPlatform?: Record<string, ProductPlatformWebhookOverride>;
  credentialsByPlatform?: Record<string, ProductPlatformCredential>;
}

export type AppCaptureViewport = 'desktop' | 'mobile' | 'tablet';

export interface ProductAppCaptureScreen {
  label: string;
  path?: string;
  viewport?: AppCaptureViewport;
  waitMs?: number;
}

export interface ProductAppCaptureConfig {
  enabled: boolean;
  loginUrl: string | null;
  appUrl: string | null;
  email: string | null;
  hasPassword: boolean;
  password: string | null;
  emailSelector: string | null;
  passwordSelector: string | null;
  submitSelector: string | null;
  postLoginWaitMs: number;
  screens: ProductAppCaptureScreen[];
  autoCaptureBeforeGenerate: boolean;
  configured: boolean;
  lastCaptureAt: string | null;
  lastCaptureStatus: 'success' | 'failed' | null;
  lastCaptureError: string | null;
  lastCaptureCount: number;
  screenshotCountInKit: number;
  manifestUrl: string | null;
  resolvedManifestUrl: string | null;
  manifestUrlConfigured: boolean;
  usesTutorialManifest: boolean;
}

export interface UpdateProductAppCapturePayload {
  enabled?: boolean;
  loginUrl?: string;
  appUrl?: string;
  email?: string;
  password?: string;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  postLoginWaitMs?: number;
  screens?: ProductAppCaptureScreen[];
  autoCaptureBeforeGenerate?: boolean;
  manifestUrl?: string;
}

export interface ProductAppCaptureRunResult {
  status: 'success' | 'failed';
  capturedCount: number;
  items: Array<{ id: string; label: string | null; assetId: string }>;
  error?: string;
}

