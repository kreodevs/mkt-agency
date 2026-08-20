import { existsSync } from 'fs';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Browser, Page } from 'playwright-core';
import { chromium } from 'playwright-core';
import type {
  AppCaptureViewport,
  ProductAppCaptureConfig,
  ProductAppCaptureScreen,
} from './domain/product-app-capture.metadata.util';

export type CapturedScreenshot = {
  label: string;
  buffer: Buffer;
  filename: string;
};

const VIEWPORT_SIZES: Record<AppCaptureViewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
};

const DEFAULT_EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name="email"]',
  'input[name="username"]',
  'input[id="email"]',
  'input[id="username"]',
];

const DEFAULT_PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  'input[id="password"]',
];

const DEFAULT_SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Iniciar")',
  'button:has-text("Entrar")',
  'button:has-text("Sign in")',
];

@Injectable()
export class AppScreenshotCaptureService {
  private readonly logger = new Logger(AppScreenshotCaptureService.name);

  async capture(config: ProductAppCaptureConfig): Promise<CapturedScreenshot[]> {
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
      });
      const page = await context.newPage();
      page.setDefaultTimeout(45_000);

      await this.performLogin(page, config);
      await page.waitForTimeout(config.postLoginWaitMs);

      const results: CapturedScreenshot[] = [];

      for (const [index, screen] of config.screens.entries()) {
        const targetUrl = resolveScreenUrl(config.appUrl, screen.path);
        const viewport = screen.viewport ?? 'desktop';
        await page.setViewportSize(VIEWPORT_SIZES[viewport]);
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45_000 });
        if (screen.waitMs && screen.waitMs > 0) {
          await page.waitForTimeout(screen.waitMs);
        }

        const buffer = await page.screenshot({ type: 'png', fullPage: false });
        const slug = slugify(screen.label);
        results.push({
          label: screen.label,
          buffer,
          filename: `app-capture-${slug || `screen-${index + 1}`}-${viewport}.png`,
        });
      }

      return results;
    } finally {
      await browser?.close().catch((error) => {
        this.logger.warn(`No se pudo cerrar el navegador: ${String(error)}`);
      });
    }
  }

  private async performLogin(page: Page, config: ProductAppCaptureConfig): Promise<void> {
    await page.goto(config.loginUrl!, { waitUntil: 'domcontentloaded', timeout: 45_000 });

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

    await page.fill(emailSelector, config.email!);
    await page.fill(passwordSelector, config.password!);

    const submitSelector = await this.resolveSelector(
      page,
      config.submitSelector,
      DEFAULT_SUBMIT_SELECTORS,
    );

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 45_000 }).catch(() => undefined),
      page.click(submitSelector),
    ]);
  }

  private async resolveSelector(
    page: Page,
    custom: string | null,
    defaults: string[],
  ): Promise<string> {
    if (custom?.trim()) {
      await page.waitForSelector(custom.trim(), { timeout: 15_000 });
      return custom.trim();
    }

    for (const selector of defaults) {
      const handle = await page.$(selector);
      if (handle) {
        await handle.dispose();
        return selector;
      }
    }

    throw new ServiceUnavailableException({
      error: 'No se encontró el campo de login en la página. Configura selectores CSS personalizados.',
      code: 'CAPTURE_LOGIN_FAILED',
    });
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
