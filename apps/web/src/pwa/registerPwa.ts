import { registerSW } from 'virtual:pwa-register';
import { PWA_UPDATE_CHECK_MS } from '@/pwa/constants';

const BUILT_VERSION = import.meta.env.VITE_APP_VERSION?.trim() || '';

let registrationRef: ServiceWorkerRegistration | undefined;
let updateIntervalId: ReturnType<typeof setInterval> | undefined;
let versionCheckInFlight = false;

function checkForServiceWorkerUpdate(): void {
  void registrationRef?.update().catch(() => undefined);
}

/** Red de seguridad: version.json cambia en cada deploy (commit Dokploy). */
async function checkForVersionMismatch(): Promise<void> {
  if (!BUILT_VERSION || versionCheckInFlight) {
    return;
  }

  versionCheckInFlight = true;
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { build?: string };
    if (payload.build && payload.build !== BUILT_VERSION) {
      window.location.reload();
    }
  } catch {
    // Sin red o endpoint no disponible: el SW sigue siendo la fuente principal.
  } finally {
    versionCheckInFlight = false;
  }
}

function checkForDeployUpdate(): void {
  checkForServiceWorkerUpdate();
  void checkForVersionMismatch();
}

function clearUpdateInterval(): void {
  if (updateIntervalId !== undefined) {
    clearInterval(updateIntervalId);
    updateIntervalId = undefined;
  }
}

/** Tras un deploy, chunks con hash viejo fallan al import dinámico. */
function initStaleAssetRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

function initVisibilityUpdateCheck(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForDeployUpdate();
    }
  });
}

function schedulePeriodicUpdateChecks(): void {
  clearUpdateInterval();
  updateIntervalId = setInterval(checkForDeployUpdate, PWA_UPDATE_CHECK_MS);
}

export function initPwaUpdates(): void {
  initStaleAssetRecovery();

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  initVisibilityUpdateCheck();

  const register = () => {
    registerSW({
      immediate: true,
      onRegisterError(error: unknown) {
        console.warn('[PWA] No se pudo registrar el service worker', error);
      },
      onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
        if (!registration) {
          return;
        }
        registrationRef = registration;
        checkForDeployUpdate();
        schedulePeriodicUpdateChecks();
      },
    });
  };

  window.addEventListener('pagehide', clearUpdateInterval, { once: true });

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
