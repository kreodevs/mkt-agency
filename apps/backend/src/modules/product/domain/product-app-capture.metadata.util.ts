export const PRODUCT_APP_CAPTURE_ENABLED_KEY = 'appCaptureEnabled';
export const PRODUCT_APP_CAPTURE_LOGIN_URL_KEY = 'appCaptureLoginUrl';
export const PRODUCT_APP_CAPTURE_APP_URL_KEY = 'appCaptureAppUrl';
export const PRODUCT_APP_CAPTURE_EMAIL_KEY = 'appCaptureEmail';
export const PRODUCT_APP_CAPTURE_PASSWORD_KEY = 'appCapturePassword';
export const PRODUCT_APP_CAPTURE_EMAIL_SELECTOR_KEY = 'appCaptureEmailSelector';
export const PRODUCT_APP_CAPTURE_PASSWORD_SELECTOR_KEY = 'appCapturePasswordSelector';
export const PRODUCT_APP_CAPTURE_SUBMIT_SELECTOR_KEY = 'appCaptureSubmitSelector';
export const PRODUCT_APP_CAPTURE_POST_LOGIN_WAIT_MS_KEY = 'appCapturePostLoginWaitMs';
export const PRODUCT_APP_CAPTURE_SCREENS_KEY = 'appCaptureScreens';
export const PRODUCT_APP_CAPTURE_AUTO_BEFORE_GENERATE_KEY = 'appCaptureAutoBeforeGenerate';
export const PRODUCT_APP_CAPTURE_LAST_AT_KEY = 'appCaptureLastAt';
export const PRODUCT_APP_CAPTURE_LAST_STATUS_KEY = 'appCaptureLastStatus';
export const PRODUCT_APP_CAPTURE_LAST_ERROR_KEY = 'appCaptureLastError';
export const PRODUCT_APP_CAPTURE_LAST_COUNT_KEY = 'appCaptureLastCount';

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
  password: string | null;
  emailSelector: string | null;
  passwordSelector: string | null;
  submitSelector: string | null;
  postLoginWaitMs: number;
  screens: ProductAppCaptureScreen[];
  autoCaptureBeforeGenerate: boolean;
  lastCaptureAt: string | null;
  lastCaptureStatus: 'success' | 'failed' | null;
  lastCaptureError: string | null;
  lastCaptureCount: number;
}

function readScreens(value: unknown): ProductAppCaptureScreen[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!label) return null;

      const viewport =
        item.viewport === 'desktop' || item.viewport === 'mobile' || item.viewport === 'tablet'
          ? item.viewport
          : undefined;

      return {
        label,
        ...(typeof item.path === 'string' && item.path.trim() ? { path: item.path.trim() } : {}),
        ...(viewport ? { viewport } : {}),
        ...(typeof item.waitMs === 'number' && item.waitMs >= 0 ? { waitMs: item.waitMs } : {}),
      } satisfies ProductAppCaptureScreen;
    })
    .filter((item): item is ProductAppCaptureScreen => item !== null);
}

export function getDefaultAppCaptureScreens(): ProductAppCaptureScreen[] {
  return [
    { label: 'Dashboard desktop', viewport: 'desktop' },
    { label: 'Dashboard móvil', viewport: 'mobile' },
  ];
}

export function getProductAppCaptureConfig(
  metadata: Record<string, unknown> | null | undefined,
): ProductAppCaptureConfig {
  const loginUrl =
    typeof metadata?.[PRODUCT_APP_CAPTURE_LOGIN_URL_KEY] === 'string'
      ? metadata[PRODUCT_APP_CAPTURE_LOGIN_URL_KEY]
      : null;
  const appUrl =
    typeof metadata?.[PRODUCT_APP_CAPTURE_APP_URL_KEY] === 'string'
      ? metadata[PRODUCT_APP_CAPTURE_APP_URL_KEY]
      : null;
  const email =
    typeof metadata?.[PRODUCT_APP_CAPTURE_EMAIL_KEY] === 'string'
      ? metadata[PRODUCT_APP_CAPTURE_EMAIL_KEY]
      : null;
  const password =
    typeof metadata?.[PRODUCT_APP_CAPTURE_PASSWORD_KEY] === 'string'
      ? metadata[PRODUCT_APP_CAPTURE_PASSWORD_KEY]
      : null;

  const screens = readScreens(metadata?.[PRODUCT_APP_CAPTURE_SCREENS_KEY]);
  const postLoginWaitMs =
    typeof metadata?.[PRODUCT_APP_CAPTURE_POST_LOGIN_WAIT_MS_KEY] === 'number'
      ? Math.min(Math.max(metadata[PRODUCT_APP_CAPTURE_POST_LOGIN_WAIT_MS_KEY], 0), 30_000)
      : 2500;

  const lastStatusRaw = metadata?.[PRODUCT_APP_CAPTURE_LAST_STATUS_KEY];
  const lastCaptureStatus =
    lastStatusRaw === 'success' || lastStatusRaw === 'failed' ? lastStatusRaw : null;

  return {
    enabled: metadata?.[PRODUCT_APP_CAPTURE_ENABLED_KEY] === true,
    loginUrl: loginUrl && loginUrl.length > 0 ? loginUrl : null,
    appUrl: appUrl && appUrl.length > 0 ? appUrl : null,
    email: email && email.length > 0 ? email : null,
    password: password && password.length > 0 ? password : null,
    emailSelector:
      typeof metadata?.[PRODUCT_APP_CAPTURE_EMAIL_SELECTOR_KEY] === 'string'
        ? metadata[PRODUCT_APP_CAPTURE_EMAIL_SELECTOR_KEY]
        : null,
    passwordSelector:
      typeof metadata?.[PRODUCT_APP_CAPTURE_PASSWORD_SELECTOR_KEY] === 'string'
        ? metadata[PRODUCT_APP_CAPTURE_PASSWORD_SELECTOR_KEY]
        : null,
    submitSelector:
      typeof metadata?.[PRODUCT_APP_CAPTURE_SUBMIT_SELECTOR_KEY] === 'string'
        ? metadata[PRODUCT_APP_CAPTURE_SUBMIT_SELECTOR_KEY]
        : null,
    postLoginWaitMs,
    screens: screens.length > 0 ? screens : getDefaultAppCaptureScreens(),
    autoCaptureBeforeGenerate: metadata?.[PRODUCT_APP_CAPTURE_AUTO_BEFORE_GENERATE_KEY] === true,
    lastCaptureAt:
      typeof metadata?.[PRODUCT_APP_CAPTURE_LAST_AT_KEY] === 'string'
        ? metadata[PRODUCT_APP_CAPTURE_LAST_AT_KEY]
        : null,
    lastCaptureStatus,
    lastCaptureError:
      typeof metadata?.[PRODUCT_APP_CAPTURE_LAST_ERROR_KEY] === 'string'
        ? metadata[PRODUCT_APP_CAPTURE_LAST_ERROR_KEY]
        : null,
    lastCaptureCount:
      typeof metadata?.[PRODUCT_APP_CAPTURE_LAST_COUNT_KEY] === 'number'
        ? metadata[PRODUCT_APP_CAPTURE_LAST_COUNT_KEY]
        : 0,
  };
}

export function isProductAppCaptureConfigured(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  const config = getProductAppCaptureConfig(metadata);
  return (
    config.enabled &&
    Boolean(config.loginUrl) &&
    Boolean(config.appUrl) &&
    Boolean(config.email) &&
    Boolean(config.password)
  );
}

export function withProductAppCaptureMetadata(
  metadata: Record<string, unknown>,
  patch: Partial<{
    enabled: boolean;
    loginUrl: string | null;
    appUrl: string | null;
    email: string | null;
    password: string | null;
    emailSelector: string | null;
    passwordSelector: string | null;
    submitSelector: string | null;
    postLoginWaitMs: number;
    screens: ProductAppCaptureScreen[];
    autoCaptureBeforeGenerate: boolean;
    lastCaptureAt: string | null;
    lastCaptureStatus: 'success' | 'failed' | null;
    lastCaptureError: string | null;
    lastCaptureCount: number;
  }>,
): Record<string, unknown> {
  const next = { ...metadata };

  if (patch.enabled !== undefined) {
    next[PRODUCT_APP_CAPTURE_ENABLED_KEY] = patch.enabled;
  }
  if (patch.loginUrl !== undefined) {
    if (patch.loginUrl) next[PRODUCT_APP_CAPTURE_LOGIN_URL_KEY] = patch.loginUrl;
    else delete next[PRODUCT_APP_CAPTURE_LOGIN_URL_KEY];
  }
  if (patch.appUrl !== undefined) {
    if (patch.appUrl) next[PRODUCT_APP_CAPTURE_APP_URL_KEY] = patch.appUrl;
    else delete next[PRODUCT_APP_CAPTURE_APP_URL_KEY];
  }
  if (patch.email !== undefined) {
    if (patch.email) next[PRODUCT_APP_CAPTURE_EMAIL_KEY] = patch.email;
    else delete next[PRODUCT_APP_CAPTURE_EMAIL_KEY];
  }
  if (patch.password !== undefined) {
    if (patch.password) next[PRODUCT_APP_CAPTURE_PASSWORD_KEY] = patch.password;
    else delete next[PRODUCT_APP_CAPTURE_PASSWORD_KEY];
  }
  if (patch.emailSelector !== undefined) {
    if (patch.emailSelector) next[PRODUCT_APP_CAPTURE_EMAIL_SELECTOR_KEY] = patch.emailSelector;
    else delete next[PRODUCT_APP_CAPTURE_EMAIL_SELECTOR_KEY];
  }
  if (patch.passwordSelector !== undefined) {
    if (patch.passwordSelector) next[PRODUCT_APP_CAPTURE_PASSWORD_SELECTOR_KEY] = patch.passwordSelector;
    else delete next[PRODUCT_APP_CAPTURE_PASSWORD_SELECTOR_KEY];
  }
  if (patch.submitSelector !== undefined) {
    if (patch.submitSelector) next[PRODUCT_APP_CAPTURE_SUBMIT_SELECTOR_KEY] = patch.submitSelector;
    else delete next[PRODUCT_APP_CAPTURE_SUBMIT_SELECTOR_KEY];
  }
  if (patch.postLoginWaitMs !== undefined) {
    next[PRODUCT_APP_CAPTURE_POST_LOGIN_WAIT_MS_KEY] = patch.postLoginWaitMs;
  }
  if (patch.screens !== undefined) {
    next[PRODUCT_APP_CAPTURE_SCREENS_KEY] = patch.screens;
  }
  if (patch.autoCaptureBeforeGenerate !== undefined) {
    next[PRODUCT_APP_CAPTURE_AUTO_BEFORE_GENERATE_KEY] = patch.autoCaptureBeforeGenerate;
  }
  if (patch.lastCaptureAt !== undefined) {
    if (patch.lastCaptureAt) next[PRODUCT_APP_CAPTURE_LAST_AT_KEY] = patch.lastCaptureAt;
    else delete next[PRODUCT_APP_CAPTURE_LAST_AT_KEY];
  }
  if (patch.lastCaptureStatus !== undefined) {
    if (patch.lastCaptureStatus) next[PRODUCT_APP_CAPTURE_LAST_STATUS_KEY] = patch.lastCaptureStatus;
    else delete next[PRODUCT_APP_CAPTURE_LAST_STATUS_KEY];
  }
  if (patch.lastCaptureError !== undefined) {
    if (patch.lastCaptureError) next[PRODUCT_APP_CAPTURE_LAST_ERROR_KEY] = patch.lastCaptureError;
    else delete next[PRODUCT_APP_CAPTURE_LAST_ERROR_KEY];
  }
  if (patch.lastCaptureCount !== undefined) {
    next[PRODUCT_APP_CAPTURE_LAST_COUNT_KEY] = patch.lastCaptureCount;
  }

  return next;
}
