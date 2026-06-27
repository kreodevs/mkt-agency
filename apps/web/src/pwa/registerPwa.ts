import { registerSW } from 'virtual:pwa-register';

const VERSION_STORAGE_KEY = 'mkt-agency-app-version';
const UPDATE_CHECK_MS = 60_000;
const RELOAD_FALLBACK_MS = 4_000;

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  let reloading = false;
  const reloadOnce = () => {
    if (reloading) {
      return;
    }
    reloading = true;
    window.location.reload();
  };

  const updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl: string | undefined, registration: ServiceWorkerRegistration | undefined) {
      if (!registration) {
        return;
      }

      const checkServiceWorker = () => {
        void registration.update();
      };

      checkServiceWorker();
      window.setInterval(checkServiceWorker, UPDATE_CHECK_MS);
    },
    onRegisterError(error: unknown) {
      console.warn('[PWA] No se pudo registrar el service worker', error);
    },
  });

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    reloadOnce();
  });

  void startVersionPolling(async () => {
    await activateWaitingServiceWorker();
    void updateServiceWorker(true);
    window.setTimeout(reloadOnce, RELOAD_FALLBACK_MS);
  });
}

async function activateWaitingServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration) {
    return;
  }

  await registration.update().catch(() => undefined);

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

async function startVersionPolling(onRemoteVersionChange: () => void | Promise<void>): Promise<void> {
  const checkVersion = async (): Promise<void> => {
    try {
      const response = await fetch(`/version.json?_=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { version?: string };
      const nextVersion = payload.version?.trim();
      if (!nextVersion) {
        return;
      }

      const currentVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      if (currentVersion && currentVersion !== nextVersion) {
        localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);
        await onRemoteVersionChange();
        return;
      }

      if (!currentVersion) {
        localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);
      }
    } catch {
      // Offline or transient network errors — skip until next interval.
    }
  };

  await checkVersion();
  window.setInterval(() => {
    void checkVersion();
  }, UPDATE_CHECK_MS);
}
