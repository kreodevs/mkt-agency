import { registerSW } from 'virtual:pwa-register';
import { PWA_UPDATE_CHECK_MS } from '@/pwa/constants';

let registrationRef: ServiceWorkerRegistration | undefined;
let updateIntervalId: ReturnType<typeof setInterval> | undefined;

function checkForServiceWorkerUpdate(): void {
  void registrationRef?.update().catch(() => undefined);
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
      checkForServiceWorkerUpdate();
    }
  });
}

function schedulePeriodicUpdateChecks(): void {
  clearUpdateInterval();
  updateIntervalId = setInterval(checkForServiceWorkerUpdate, PWA_UPDATE_CHECK_MS);
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
        checkForServiceWorkerUpdate();
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
