export interface TutorialManifestFlowStep {
  label?: string;
  action: string;
  selector?: string;
  value?: string;
}

export interface NormalizedManifestModule {
  id: string;
  title: string;
  path: string;
  fullUrl?: string;
  disabled?: boolean;
  flow?: TutorialManifestFlowStep[];
  waitSelector?: string;
}

/** Manifest normalizado: soporta OralTrack y variantes genéricas. */
export interface AppCaptureManifest {
  appName?: string;
  baseUrl: string;
  sourceUrl: string;
  preferredModuleIds: string[];
  authPaths: string[];
  loginPath: string | null;
  loginFlow: TutorialManifestFlowStep[];
  modules: NormalizedManifestModule[];
}

export type ManifestCaptureRoute = {
  label: string;
  url: string;
  waitSelector?: string;
  waitMs?: number;
};

const DEFAULT_AUTH_PATHS = [
  '/login',
  '/signin',
  '/sign-in',
  '/auth/login',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
  '/registro',
  '/register',
  '/signup',
];

const DEFAULT_DYNAMIC_PATH_HINTS = [
  'sesion-clinica',
  '/detalle',
  '/detail/',
  '/admin',
  ':id',
  '{id}',
];

const MODULE_ARRAY_KEYS = ['modules', 'pages', 'screens', 'routes', 'views'] as const;

export function resolveTutorialManifestUrl(
  appUrl: string,
  customUrl?: string | null,
): string | null {
  if (customUrl?.trim()) return customUrl.trim();
  if (!appUrl?.trim()) return null;
  try {
    const origin = new URL(appUrl).origin;
    return `${origin}/tutorial-manifest.json`;
  } catch {
    return null;
  }
}

export async function fetchAppCaptureManifest(
  manifestUrl: string,
  fallbackBaseUrl: string,
): Promise<AppCaptureManifest | null> {
  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;

    const raw: unknown = await response.json();
    return normalizeAppCaptureManifest(raw, {
      fallbackBaseUrl,
      manifestUrl,
    });
  } catch {
    return null;
  }
}

/** @deprecated alias interno */
export async function fetchTutorialManifest(
  url: string,
  fallbackBaseUrl = url,
): Promise<AppCaptureManifest | null> {
  return fetchAppCaptureManifest(url, fallbackBaseUrl);
}

export function normalizeAppCaptureManifest(
  raw: unknown,
  context: { fallbackBaseUrl: string; manifestUrl: string },
): AppCaptureManifest | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const doc = raw as Record<string, unknown>;

  const baseUrl = readBaseUrl(doc, context.fallbackBaseUrl, context.manifestUrl);
  if (!baseUrl) return null;

  const authPaths = readStringArray(doc.authPaths ?? doc.auth_paths ?? doc.publicPaths)
    .concat(readNestedStringArray(readRecord(doc.coverageNotes), 'authPublico'))
    .concat(DEFAULT_AUTH_PATHS)
    .map(normalizePath)
    .filter(Boolean);

  const preferredModuleIds = readPreferredModuleIds(doc);
  const modules = readModules(doc, baseUrl);
  if (modules.length === 0) return null;

  const loginBlock = readLoginBlock(doc, modules, authPaths);

  return {
    appName: readString(doc.app ?? doc.appName ?? doc.name) ?? undefined,
    baseUrl,
    sourceUrl: context.manifestUrl,
    preferredModuleIds,
    authPaths: Array.from(new Set(authPaths)),
    loginPath: loginBlock.path,
    loginFlow: loginBlock.flow,
    modules,
  };
}

export function getLoginModule(manifest: AppCaptureManifest): {
  path: string;
  flow: TutorialManifestFlowStep[];
} | null {
  if (manifest.loginFlow.length > 0 && manifest.loginPath) {
    return { path: manifest.loginPath, flow: manifest.loginFlow };
  }

  const module =
    manifest.modules.find((item) => item.id === 'page-login' || item.path === '/login') ?? null;
  if (!module?.flow?.length) return null;
  return { path: module.path, flow: module.flow };
}

export function getCaptureRoutesFromManifest(
  manifest: AppCaptureManifest,
  maxRoutes: number,
): ManifestCaptureRoute[] {
  const eligible = manifest.modules.filter((module) =>
    isCaptureEligibleModule(module, manifest.authPaths),
  );

  const byId = new Map(eligible.map((module) => [module.id, module]));
  const ordered: NormalizedManifestModule[] = [];

  for (const preferredId of manifest.preferredModuleIds) {
    const module =
      byId.get(preferredId) ??
      byId.get(`nav-${preferredId}`) ??
      byId.get(`page-${preferredId}`) ??
      eligible.find(
        (item) =>
          item.id === preferredId ||
          item.id.endsWith(`-${preferredId}`) ||
          item.path.includes(preferredId),
      );
    if (module && !ordered.some((item) => item.id === module.id)) {
      ordered.push(module);
    }
  }

  for (const module of eligible) {
    if (ordered.length >= maxRoutes) break;
    if (ordered.some((item) => item.id === module.id)) continue;
    ordered.push(module);
  }

  return ordered.slice(0, maxRoutes).map((module) => ({
    label: module.title,
    url: module.fullUrl ?? joinManifestUrl(manifest.baseUrl, module.path),
    waitSelector: module.waitSelector ?? getPageWaitSelector(module),
    waitMs: 2500,
  }));
}

export function isCaptureEligibleModule(
  module: NormalizedManifestModule,
  authPaths: string[],
): boolean {
  if (module.disabled) return false;

  const path = normalizePath(module.path).toLowerCase();
  const full = (module.fullUrl ?? '').toLowerCase();

  if (authPaths.some((authPath) => path === authPath || path.startsWith(`${authPath}/`))) {
    return false;
  }
  if (DEFAULT_DYNAMIC_PATH_HINTS.some((hint) => path.includes(hint) || full.includes(hint))) {
    return false;
  }
  if (!module.path?.trim() && !module.fullUrl?.trim()) return false;
  return true;
}

function readModules(doc: Record<string, unknown>, baseUrl: string): NormalizedManifestModule[] {
  for (const key of MODULE_ARRAY_KEYS) {
    const entries = doc[key];
    if (!Array.isArray(entries)) continue;

    const modules = entries
      .map((entry, index) => normalizeModuleEntry(entry, index, baseUrl))
      .filter((entry): entry is NormalizedManifestModule => entry !== null);

    if (modules.length > 0) return modules;
  }

  return [];
}

function normalizeModuleEntry(
  entry: unknown,
  index: number,
  baseUrl: string,
): NormalizedManifestModule | null {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const item = entry as Record<string, unknown>;

  const title =
    readString(item.title ?? item.name ?? item.label ?? item.screenName) ??
    `Pantalla ${index + 1}`;
  const id =
    readString(item.navId ?? item.id ?? item.key ?? item.slug) ??
    slugify(title) ??
    `screen-${index + 1}`;

  const fullUrl = readAbsoluteUrl(item.url ?? item.href ?? item.fullUrl) ?? undefined;
  const path =
    normalizePath(readString(item.path ?? item.route ?? item.slug ?? item.pathname) ?? '') ||
    (fullUrl ? pathFromUrl(fullUrl, baseUrl) : '');

  if (!path && !fullUrl) return null;

  const flow = readFlow(item.flow ?? item.steps ?? item.actions);
  const waitSelector =
    readString(item.waitSelector ?? item.waitFor ?? item.readySelector ?? item.selector) ??
    getPageWaitSelector({ flow });

  const disabled =
    item.disabled === true ||
    item.skip === true ||
    item.hidden === true ||
    item.capture === false;

  return {
    id,
    title,
    path: path || '/',
    fullUrl,
    disabled,
    flow,
    waitSelector,
  };
}

function readLoginBlock(
  doc: Record<string, unknown>,
  modules: NormalizedManifestModule[],
  authPaths: string[],
): { path: string | null; flow: TutorialManifestFlowStep[] } {
  const loginDoc = readRecord(doc.login ?? doc.auth ?? doc.authentication);
  const loginFromRoot = readFlow(loginDoc.flow ?? loginDoc.steps);

  if (loginFromRoot.length > 0) {
    const path =
      normalizePath(readString(loginDoc.path ?? loginDoc.url) ?? '') ||
      authPaths.find((value) => value.includes('login')) ||
      '/login';
    return { path, flow: loginFromRoot };
  }

  const emailSelector = readString(loginDoc.emailSelector ?? loginDoc.email ?? loginDoc.userSelector);
  const passwordSelector = readString(loginDoc.passwordSelector ?? loginDoc.password);
  const submitSelector = readString(loginDoc.submitSelector ?? loginDoc.submit);

  if (emailSelector && passwordSelector && submitSelector) {
    const path =
      normalizePath(readString(loginDoc.path) ?? '') ||
      authPaths.find((value) => value.includes('login')) ||
      '/login';
    return {
      path,
      flow: [
        { action: 'fill', selector: emailSelector, label: 'Email' },
        { action: 'fill', selector: passwordSelector, label: 'Password' },
        { action: 'click', selector: submitSelector, label: 'Submit' },
      ],
    };
  }

  const loginModule =
    modules.find((module) => module.id === 'page-login' || module.path === '/login') ?? null;
  if (loginModule?.flow?.length) {
    return { path: loginModule.path, flow: loginModule.flow };
  }

  return { path: null, flow: [] };
}

function readPreferredModuleIds(doc: Record<string, unknown>): string[] {
  const coverage = readRecord(doc.coverageNotes ?? doc.coverage ?? doc.meta);
  return uniqueStrings([
    ...readStringArray(doc.preferredScreens ?? doc.captureOrder ?? doc.featuredModules),
    ...readStringArray(doc.priority),
    ...readNestedStringArray(coverage, 'microTutorialesActivos'),
    ...readNestedStringArray(coverage, 'capturePriority'),
    ...readNestedStringArray(coverage, 'screenshots'),
  ]);
}

function readBaseUrl(
  doc: Record<string, unknown>,
  fallbackBaseUrl: string,
  manifestUrl: string,
): string | null {
  const candidates = [
    doc.baseUrl,
    doc.base_url,
    doc.appBaseUrl,
    doc.origin,
    readString(readRecord(doc.app)?.baseUrl),
  ];

  for (const candidate of candidates) {
    const value = readAbsoluteUrl(candidate);
    if (value) return value.replace(/\/$/, '');
  }

  const fallback = readAbsoluteUrl(fallbackBaseUrl);
  if (fallback) return fallback.replace(/\/$/, '');

  try {
    return new URL(manifestUrl).origin;
  } catch {
    return null;
  }
}

function readFlow(value: unknown): TutorialManifestFlowStep[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const step = entry as Record<string, unknown>;
      const action = readString(step.action ?? step.type);
      if (!action) return null;
      return {
        action,
        ...(readString(step.label) ? { label: readString(step.label)! } : {}),
        ...(readString(step.selector ?? step.target) ? { selector: readString(step.selector ?? step.target)! } : {}),
        ...(readString(step.value) ? { value: readString(step.value)! } : {}),
      } satisfies TutorialManifestFlowStep;
    })
    .filter((step): step is TutorialManifestFlowStep => step !== null);
}

function getPageWaitSelector(module: { flow?: TutorialManifestFlowStep[] }): string | undefined {
  for (const step of module.flow ?? []) {
    if (step.action !== 'wait' || !step.selector) continue;
    return step.selector;
  }
  return undefined;
}

function joinManifestUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function pathFromUrl(url: string, baseUrl: string): string {
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    if (target.origin !== base.origin) return url;
    return `${target.pathname}${target.search}`;
  } catch {
    return url;
  }
}

function normalizePath(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readAbsoluteUrl(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) return null;
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function readNestedStringArray(parent: Record<string, unknown>, key: string): string[] {
  return readStringArray(parent[key]);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function slugify(value: string): string | null {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || null;
}

/** Contrato mínimo documentado para integradores. */
export const APP_CAPTURE_MANIFEST_CONTRACT = {
  required: ['baseUrl + (modules|pages|screens|routes|views)'],
  recommended: ['login.flow o login.emailSelector/passwordSelector/submitSelector'],
  optional: ['preferredScreens', 'coverageNotes.microTutorialesActivos', 'authPaths'],
} as const;
