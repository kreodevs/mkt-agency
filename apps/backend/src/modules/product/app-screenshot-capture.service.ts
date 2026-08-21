import { existsSync } from 'fs';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Browser, Page } from 'playwright-core';
import { chromium } from 'playwright-core';
import {
  APP_CAPTURE_MIN_UNIQUE_SCREENS,
  APP_CAPTURE_VIEWPORTS,
  type AppCaptureViewport,
  type ProductAppCaptureConfig,
} from './domain/product-app-capture.metadata.util';
import {
  fetchAppCaptureManifest,
  getCaptureRoutesFromManifest,
  getLoginModule,
  resolveTutorialManifestUrl,
  type AppCaptureManifest,
} from './domain/tutorial-manifest.util';

export type CapturedScreenshot = {
  label: string;
  buffer: Buffer;
  filename: string;
};

export type AppCaptureResult = {
  screenshots: CapturedScreenshot[];
  usedTutorialManifest: boolean;
  manifestUrl: string | null;
};

type CaptureRoute = {
  label: string;
  url: string;
  waitMs?: number;
  waitSelector?: string;
  viewports?: AppCaptureViewport[];
};

const VIEWPORT_SIZES: Record<AppCaptureViewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
};

const DEFAULT_EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[autocomplete="email"]',
  'input[autocomplete="username"]',
  'input[name="email"]',
  'input[name="username"]',
  'input[id="email"]',
  'input[id="username"]',
  'input[placeholder*="correo" i]',
  'input[placeholder*="email" i]',
  'input[placeholder*="usuario" i]',
];

const DEFAULT_PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  'input[id="password"]',
  'input[autocomplete="current-password"]',
];

const DEFAULT_SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'form button',
  'button:has-text("Acceder")',
  'button:has-text("Continuar")',
  'button:has-text("Iniciar sesión")',
  'button:has-text("Iniciar sesion")',
  'button:has-text("Ingresar")',
  'button:has-text("Entrar")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Iniciar")',
  'button:has-text("Sign in")',
];

const LOGIN_PATH_HINTS = ['/login', '/signin', '/sign-in', '/auth', '/acceder'];

@Injectable()
export class AppScreenshotCaptureService {
  private readonly logger = new Logger(AppScreenshotCaptureService.name);

  async capture(config: ProductAppCaptureConfig): Promise<AppCaptureResult> {
    const executablePath = resolveChromiumPath();
    if (!executablePath) {
      throw new ServiceUnavailableException({
        error:
          'Captura de pantalla no disponible: falta Chromium en el servidor. Contacta al administrador.',
        code: 'CAPTURE_UNAVAILABLE',
      });
    }

    if (!config.loginUrl || !config.appUrl || !config.email || !config.password) {
      throw new ServiceUnavailableException({
        error: 'Configura URL de login, app, email y contraseña antes de capturar.',
        code: 'CAPTURE_NOT_CONFIGURED',
      });
    }

    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        viewport: VIEWPORT_SIZES.desktop,
        ignoreHTTPSErrors: true,
        locale: 'es-ES',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(45_000);

      const manifestUrl = resolveTutorialManifestUrl(config.appUrl, config.manifestUrl);
      const manifest = manifestUrl
        ? await fetchAppCaptureManifest(manifestUrl, config.appUrl)
        : null;
      const usedTutorialManifest = Boolean(manifest);

      if (manifest) {
        this.logger.log(
          `Usando manifest de captura (${manifest.appName ?? 'app'}): ${manifestUrl}`,
        );
        await this.performManifestLogin(page, config, manifest);
      } else {
        await this.performLogin(page, config);
      }

      await page.goto(config.appUrl, { waitUntil: 'networkidle', timeout: 45_000 });
      await page.waitForTimeout(config.postLoginWaitMs);

      if (await this.isLoginFormVisible(page)) {
        throw new ServiceUnavailableException({
          error:
            'El login no completó: la app sigue mostrando el formulario de acceso. Revisa credenciales o selectores CSS.',
          code: 'CAPTURE_LOGIN_FAILED',
        });
      }

      const routes = await this.resolveCaptureRoutes(page, config, manifest);
      const results: CapturedScreenshot[] = [];

      for (const [routeIndex, route] of routes.entries()) {
        const viewports = route.viewports?.length ? route.viewports : APP_CAPTURE_VIEWPORTS;

        for (const viewport of viewports) {
          await page.setViewportSize(VIEWPORT_SIZES[viewport]);
          await page.goto(route.url, { waitUntil: 'networkidle', timeout: 45_000 });

          if (await this.isLoginFormVisible(page)) {
            throw new ServiceUnavailableException({
              error: `Sesión perdida al abrir "${route.label}". Verifica que la URL post-login sea correcta.`,
              code: 'CAPTURE_SESSION_LOST',
            });
          }

          const waitMs = route.waitMs ?? 2000;
          if (route.waitSelector) {
            await page
              .waitForSelector(route.waitSelector, { state: 'visible', timeout: 25_000 })
              .catch(() => undefined);
          }
          if (waitMs > 0) {
            await page.waitForTimeout(waitMs);
          }

          const buffer = await page.screenshot({ type: 'png', fullPage: false });
          const slug = slugify(route.label);
          const viewportLabel = viewport === 'desktop' ? 'escritorio' : 'móvil';
          results.push({
            label: `${route.label} (${viewportLabel})`,
            buffer,
            filename: `app-capture-${slug || `screen-${routeIndex + 1}`}-${viewport}.png`,
          });
        }
      }

      this.logger.log(`Capturadas ${results.length} imágenes en ${routes.length} pantalla(s)`);
      return {
        screenshots: results,
        usedTutorialManifest,
        manifestUrl: usedTutorialManifest ? manifestUrl : null,
      };
    } finally {
      await browser?.close().catch((error) => {
        this.logger.warn(`No se pudo cerrar el navegador: ${String(error)}`);
      });
    }
  }

  private async performManifestLogin(
    page: Page,
    config: ProductAppCaptureConfig,
    manifest: AppCaptureManifest,
  ): Promise<void> {
    const login = getLoginModule(manifest);
    if (!login?.flow.length) {
      await this.performLogin(page, config);
      return;
    }

    const loginUrl =
      config.loginUrl ?? `${manifest.baseUrl.replace(/\/$/, '')}${login.path.startsWith('/') ? login.path : `/${login.path}`}`;

    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 45_000 });
    const urlBeforeSubmit = page.url();

    for (const step of login.flow) {
      if (!step.selector) continue;

      if (step.action === 'wait') {
        await page
          .waitForSelector(step.selector, { state: 'visible', timeout: 20_000 })
          .catch(() => undefined);
        continue;
      }

      if (step.action === 'fill') {
        const selector = step.selector.toLowerCase();
        const value = selector.includes('password')
          ? config.password!
          : selector.includes('email') || selector.includes('usuario')
            ? config.email!
            : null;
        if (!value) continue;
        await page.click(step.selector).catch(() => undefined);
        await page.fill(step.selector, value);
        continue;
      }

      if (step.action === 'click') {
        await page.click(step.selector);
        await this.waitForLoginSuccess(
          page,
          urlBeforeSubmit,
          loginUrl,
          config.postLoginWaitMs,
        );
      }
    }

    await page.goto(config.appUrl!, { waitUntil: 'networkidle', timeout: 45_000 });
  }

  private async performLogin(page: Page, config: ProductAppCaptureConfig): Promise<void> {
    const loginUrl = config.loginUrl!;
    const appUrl = config.appUrl!;

    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 45_000 });

    if (!(await this.isLoginFormVisible(page))) {
      this.logger.log('Formulario de login no visible; asumiendo sesión existente o login embebido');
      return;
    }

    const emailSelector = await this.resolveSelector(
      page,
      config.emailSelector,
      DEFAULT_EMAIL_SELECTORS,
    );
    const passwordSelector = await this.resolveSelector(
      page,
      config.passwordSelector,
      DEFAULT_PASSWORD_SELECTORS,
    );

    await page.click(emailSelector);
    await page.fill(emailSelector, config.email!);
    await page.click(passwordSelector);
    await page.fill(passwordSelector, config.password!);

    const submitSelector = await this.resolveSelector(
      page,
      config.submitSelector,
      DEFAULT_SUBMIT_SELECTORS,
    );

    const urlBeforeSubmit = page.url();
    await page.click(submitSelector);

    await this.waitForLoginSuccess(page, urlBeforeSubmit, loginUrl, config.postLoginWaitMs);

    await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 45_000 }).catch(async () => {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(config.postLoginWaitMs);
    });
  }

  private async waitForLoginSuccess(
    page: Page,
    urlBeforeSubmit: string,
    loginUrl: string,
    postLoginWaitMs: number,
  ): Promise<void> {
    const deadline = Date.now() + 45_000;

    while (Date.now() < deadline) {
      const currentUrl = page.url();
      const leftLoginPath = !this.isLikelyLoginUrl(currentUrl, loginUrl);
      const urlChanged = currentUrl !== urlBeforeSubmit;
      const formHidden = !(await this.isLoginFormVisible(page));

      if (formHidden && (urlChanged || leftLoginPath)) {
        await page.waitForTimeout(Math.min(postLoginWaitMs, 5000));
        return;
      }

      await page.waitForTimeout(750);
    }

    if (!(await this.isLoginFormVisible(page))) {
      return;
    }

    await page.keyboard.press('Enter');
    await page.waitForTimeout(postLoginWaitMs);

    if (await this.isLoginFormVisible(page)) {
      throw new ServiceUnavailableException({
        error:
          'No se pudo iniciar sesión. Comprueba usuario/contraseña o define selectores CSS en opciones avanzadas.',
        code: 'CAPTURE_LOGIN_FAILED',
      });
    }
  }

  private async resolveCaptureRoutes(
    page: Page,
    config: ProductAppCaptureConfig,
    manifest: AppCaptureManifest | null,
  ): Promise<CaptureRoute[]> {
    if (manifest) {
      const manifestRoutes = getCaptureRoutesFromManifest(manifest, APP_CAPTURE_MIN_UNIQUE_SCREENS);
      if (manifestRoutes.length >= APP_CAPTURE_MIN_UNIQUE_SCREENS) {
        return manifestRoutes.map((route) => ({
          label: route.label,
          url: route.url,
          waitMs: route.waitMs,
          waitSelector: route.waitSelector,
        }));
      }
    }

    const configured = routesFromConfig(config);
    const discovered = await this.discoverCaptureTargets(page, config.appUrl!, APP_CAPTURE_MIN_UNIQUE_SCREENS);
    const manifestFallback = manifest
      ? getCaptureRoutesFromManifest(manifest, APP_CAPTURE_MIN_UNIQUE_SCREENS).map((route) => ({
          label: route.label,
          url: route.url,
          waitMs: route.waitMs,
          waitSelector: route.waitSelector,
        }))
      : [];
    const merged = mergeUniqueRoutes(configured, [...manifestFallback, ...discovered], APP_CAPTURE_MIN_UNIQUE_SCREENS);

    if (merged.length === 0) {
      return [{ label: 'Dashboard', url: config.appUrl!, waitMs: 2000 }];
    }

    return merged.slice(0, APP_CAPTURE_MIN_UNIQUE_SCREENS);
  }

  private async discoverCaptureTargets(
    page: Page,
    appUrl: string,
    maxRoutes: number,
  ): Promise<CaptureRoute[]> {
    const origin = new URL(appUrl).origin;

    const links = await page.evaluate((pageOrigin) => {
      const selectors = [
        'nav a[href]',
        'aside a[href]',
        '[role="navigation"] a[href]',
        'header a[href]',
        'a[href]',
      ];
      const seen = new Set<string>();
      const items: Array<{ href: string; text: string }> = [];

      for (const selector of selectors) {
        for (const node of Array.from(document.querySelectorAll(selector))) {
          const anchor = node as HTMLAnchorElement;
          const href = anchor.href?.trim();
          const text = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!href || !text || seen.has(href)) continue;
          if (!href.startsWith(pageOrigin)) continue;
          if (href.includes('#') && href.split('#')[1]?.length === 0) continue;
          seen.add(href);
          items.push({ href, text: text.slice(0, 80) });
        }
      }

      return items;
    }, origin);

    const targets: CaptureRoute[] = [{ label: 'Dashboard', url: appUrl, waitMs: 2000 }];
    const seenUrls = new Set([normalizeUrl(appUrl)]);

    for (const link of links) {
      if (targets.length >= maxRoutes) break;

      const normalized = normalizeUrl(link.href);
      if (seenUrls.has(normalized)) continue;
      if (this.isLikelyLoginUrl(link.href, '')) continue;
      if (/\/logout|\/sign-out|\/salir/i.test(link.href)) continue;

      seenUrls.add(normalized);
      targets.push({
        label: link.text || `Pantalla ${targets.length + 1}`,
        url: link.href,
        waitMs: 2000,
      });
    }

    return targets;
  }

  private async isLoginFormVisible(page: Page): Promise<boolean> {
    for (const selector of DEFAULT_PASSWORD_SELECTORS) {
      const handle = await page.$(selector);
      if (handle) {
        await handle.dispose();
        return true;
      }
    }
    return false;
  }

  private isLikelyLoginUrl(currentUrl: string, loginUrl: string): boolean {
    const lower = currentUrl.toLowerCase();
    if (loginUrl && normalizeUrl(currentUrl) === normalizeUrl(loginUrl)) return true;
    return LOGIN_PATH_HINTS.some((hint) => lower.includes(hint));
  }

  private async resolveSelector(
    page: Page,
    custom: string | null,
    defaults: string[],
  ): Promise<string> {
    if (custom?.trim()) {
      await page.waitForSelector(custom.trim(), { state: 'visible', timeout: 20_000 });
      return custom.trim();
    }

    for (const selector of defaults) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 4_000 });
        return selector;
      } catch {
        continue;
      }
    }

    throw new ServiceUnavailableException({
      error: 'No se encontró el campo de login en la página. Configura selectores CSS personalizados.',
      code: 'CAPTURE_LOGIN_FAILED',
    });
  }
}

function routesFromConfig(config: ProductAppCaptureConfig): CaptureRoute[] {
  const byUrl = new Map<string, CaptureRoute>();

  for (const screen of config.screens) {
    const url = resolveScreenUrl(config.appUrl!, screen.path);
    const normalized = normalizeUrl(url);
    const viewports = screen.viewport ? [screen.viewport] : undefined;
    const existing = byUrl.get(normalized);

    if (existing) {
      if (viewports) {
        existing.viewports = uniqueViewports([...(existing.viewports ?? []), ...viewports]);
      }
      continue;
    }

    byUrl.set(normalized, {
      label: screen.label.replace(/\s+(escritorio|móvil|mobile|desktop)$/i, '').trim() || screen.label,
      url,
      waitMs: screen.waitMs,
      viewports,
    });
  }

  return Array.from(byUrl.values());
}

function mergeUniqueRoutes(
  primary: CaptureRoute[],
  secondary: CaptureRoute[],
  maxRoutes: number,
): CaptureRoute[] {
  const merged: CaptureRoute[] = [];
  const seen = new Set<string>();

  for (const route of [...primary, ...secondary]) {
    const key = normalizeUrl(route.url);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(route);
    if (merged.length >= maxRoutes) break;
  }

  return merged;
}

function uniqueViewports(viewports: AppCaptureViewport[]): AppCaptureViewport[] {
  return Array.from(new Set(viewports));
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}

function resolveScreenUrl(appUrl: string, path?: string): string {
  if (!path?.trim()) return appUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const base = appUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function resolveChromiumPath(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return undefined;
}
