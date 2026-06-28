import { registerSW } from 'virtual:pwa-register';

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  // Reload when a new service worker takes over (triggered by inline version check)
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // Register SW with auto-update — vite-plugin-pwa handles skipWaiting
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl: string | undefined, registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return;
      // Check for SW updates every 60s (backup to inline version.json polling)
      const check = () => { void registration.update(); };
      check();
      window.setInterval(check, 60_000);
    },
    onRegisterError(error: unknown) {
      console.warn('[PWA] No se pudo registrar el service worker', error);
    },
  });
}