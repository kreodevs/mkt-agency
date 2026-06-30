import { registerSW } from 'virtual:pwa-register';

const VERSION_CHECK_MS = 60_000;
const VERSION_FETCH_TIMEOUT_MS = 8_000;
const BUILD_ID = import.meta.env.VITE_APP_VERSION;

async function fetchDeployedVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), VERSION_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { version?: string };
    return payload.version?.trim() || null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function reloadOnceForVersion(version: string): Promise<void> {
  const key = `pwa-version-reload:${version}`;
  if (sessionStorage.getItem(key)) {
    return;
  }

  sessionStorage.setItem(key, '1');
  window.location.reload();
}

async function checkForNewDeploy(
  registration?: ServiceWorkerRegistration,
): Promise<void> {
  const deployedVersion = await fetchDeployedVersion();
  if (!deployedVersion || deployedVersion === BUILD_ID) {
    return;
  }

  if (registration) {
    await registration.update().catch(() => {});
    return;
  }

  await reloadOnceForVersion(deployedVersion);
}

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  const register = () => {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl: string | undefined, registration: ServiceWorkerRegistration | undefined) {
        if (!registration) {
          return;
        }

        const startChecks = () => {
          void checkForNewDeploy(registration);
          window.setInterval(() => void checkForNewDeploy(registration), VERSION_CHECK_MS);
        };

        if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            if (registration.installing?.state === 'activated') {
              startChecks();
            }
          });
          return;
        }

        startChecks();
      },
      onRegisterError(error: unknown) {
        console.warn('[PWA] No se pudo registrar el service worker', error);
      },
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
