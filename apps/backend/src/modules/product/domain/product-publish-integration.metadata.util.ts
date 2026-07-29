export const PRODUCT_PUBLISH_WEBHOOK_ENABLED_KEY = 'publishWebhookEnabled';
export const PRODUCT_PUBLISH_WEBHOOK_URL_KEY = 'publishWebhookUrl';
export const PRODUCT_PUBLISH_WEBHOOK_SECRET_KEY = 'publishWebhookSecret';
export const PRODUCT_PUBLISH_WEBHOOK_AUTO_DISPATCH_KEY = 'publishWebhookAutoDispatch';
export const PRODUCT_PUBLISH_WEBHOOKS_BY_PLATFORM_KEY = 'publishWebhooksByPlatform';
export const PRODUCT_PUBLISH_CREDENTIALS_BY_PLATFORM_KEY = 'publishCredentialsByPlatform';

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

export interface ProductPublishIntegrationConfig {
  enabled: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  autoDispatchOnReady: boolean;
  webhooksByPlatform: Record<string, ProductPlatformWebhookOverride>;
  credentialsByPlatform: Record<string, ProductPlatformCredential>;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readPlatformWebhooks(value: unknown): Record<string, ProductPlatformWebhookOverride> {
  const raw = readRecord(value);
  const result: Record<string, ProductPlatformWebhookOverride> = {};

  for (const [platform, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    result[platform] = {
      ...(typeof item.url === 'string' ? { url: item.url } : {}),
      ...(typeof item.enabled === 'boolean' ? { enabled: item.enabled } : {}),
    };
  }

  return result;
}

function readPlatformCredentials(value: unknown): Record<string, ProductPlatformCredential> {
  const raw = readRecord(value);
  const result: Record<string, ProductPlatformCredential> = {};

  for (const [platform, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    result[platform] = {
      ...(typeof item.accountId === 'string' ? { accountId: item.accountId } : {}),
      ...(typeof item.pageId === 'string' ? { pageId: item.pageId } : {}),
      ...(typeof item.accessToken === 'string' ? { accessToken: item.accessToken } : {}),
      ...(typeof item.refreshToken === 'string' ? { refreshToken: item.refreshToken } : {}),
      ...(typeof item.notes === 'string' ? { notes: item.notes } : {}),
    };
  }

  return result;
}

export function getProductPublishIntegrationConfig(
  metadata: Record<string, unknown> | null | undefined,
): ProductPublishIntegrationConfig {
  const enabled = metadata?.[PRODUCT_PUBLISH_WEBHOOK_ENABLED_KEY] === true;
  const webhookUrl =
    typeof metadata?.[PRODUCT_PUBLISH_WEBHOOK_URL_KEY] === 'string'
      ? metadata[PRODUCT_PUBLISH_WEBHOOK_URL_KEY]
      : null;
  const webhookSecret =
    typeof metadata?.[PRODUCT_PUBLISH_WEBHOOK_SECRET_KEY] === 'string'
      ? metadata[PRODUCT_PUBLISH_WEBHOOK_SECRET_KEY]
      : null;

  return {
    enabled,
    webhookUrl: webhookUrl && webhookUrl.length > 0 ? webhookUrl : null,
    webhookSecret: webhookSecret && webhookSecret.length >= 16 ? webhookSecret : null,
    autoDispatchOnReady: metadata?.[PRODUCT_PUBLISH_WEBHOOK_AUTO_DISPATCH_KEY] === true,
    webhooksByPlatform: readPlatformWebhooks(metadata?.[PRODUCT_PUBLISH_WEBHOOKS_BY_PLATFORM_KEY]),
    credentialsByPlatform: readPlatformCredentials(
      metadata?.[PRODUCT_PUBLISH_CREDENTIALS_BY_PLATFORM_KEY],
    ),
  };
}

export function isProductPublishWebhookConfigured(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  const config = getProductPublishIntegrationConfig(metadata);
  return config.enabled && Boolean(config.webhookUrl) && Boolean(config.webhookSecret);
}

export function resolveProductPublishWebhookUrl(
  metadata: Record<string, unknown> | null | undefined,
  platform: string | null | undefined,
): string | null {
  const config = getProductPublishIntegrationConfig(metadata);
  if (!config.enabled) return null;

  const normalizedPlatform = platform?.trim().toLowerCase();
  if (normalizedPlatform) {
    const override = config.webhooksByPlatform[normalizedPlatform];
    if (override?.enabled === false) return null;
    if (override?.url && override.url.length > 0) return override.url;
  }

  return config.webhookUrl;
}

export function withProductPublishIntegrationMetadata(
  metadata: Record<string, unknown>,
  patch: Partial<{
    enabled: boolean;
    webhookUrl: string | null;
    webhookSecret: string | null;
    autoDispatchOnReady: boolean;
    webhooksByPlatform: Record<string, ProductPlatformWebhookOverride>;
    credentialsByPlatform: Record<string, ProductPlatformCredential>;
  }>,
): Record<string, unknown> {
  const next = { ...metadata };

  if (patch.enabled !== undefined) {
    next[PRODUCT_PUBLISH_WEBHOOK_ENABLED_KEY] = patch.enabled;
  }
  if (patch.webhookUrl !== undefined) {
    if (patch.webhookUrl) {
      next[PRODUCT_PUBLISH_WEBHOOK_URL_KEY] = patch.webhookUrl;
    } else {
      delete next[PRODUCT_PUBLISH_WEBHOOK_URL_KEY];
    }
  }
  if (patch.webhookSecret !== undefined) {
    if (patch.webhookSecret) {
      next[PRODUCT_PUBLISH_WEBHOOK_SECRET_KEY] = patch.webhookSecret;
    } else {
      delete next[PRODUCT_PUBLISH_WEBHOOK_SECRET_KEY];
    }
  }
  if (patch.autoDispatchOnReady !== undefined) {
    next[PRODUCT_PUBLISH_WEBHOOK_AUTO_DISPATCH_KEY] = patch.autoDispatchOnReady;
  }
  if (patch.webhooksByPlatform !== undefined) {
    next[PRODUCT_PUBLISH_WEBHOOKS_BY_PLATFORM_KEY] = patch.webhooksByPlatform;
  }
  if (patch.credentialsByPlatform !== undefined) {
    next[PRODUCT_PUBLISH_CREDENTIALS_BY_PLATFORM_KEY] = patch.credentialsByPlatform;
  }

  return next;
}
