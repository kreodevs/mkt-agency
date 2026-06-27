import { registerSW } from 'virtual:pwa-register';

const VERSION_STORAGE_KEY = 'mkt-agency-app-version';
const UPDATE_CHECK_MS = 60_000;

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return;
      }

      registration.update().catch(() => undefined);
      window.setInterval(() => {
        registration.update().catch(() => undefined);
      }, UPDATE_CHECK_MS);
    },
  });

  void startVersionPolling();
}

async function startVersionPolling(): Promise<void> {
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
        window.location.reload();
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
