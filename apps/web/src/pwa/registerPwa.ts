import { registerSW } from 'virtual:pwa-register';

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  // Reload when a new service worker takes over (triggered by inline version check)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  const register = () => {
    try {
      registerSW({
        immediate: true,
        onRegisteredSW(_swUrl: string | undefined, registration: ServiceWorkerRegistration | undefined) {
          if (!registration) return;
          const check = () => {
            void registration.update().catch(() => {});
          };
          check();
          window.setInterval(check, 60_000);
        },
        onRegisterError(error: unknown) {
          console.warn('[PWA] No se pudo registrar el service worker', error);
        },
      });
    } catch (error) {
      console.warn('[PWA] Registro del service worker falló', error);
    }
  };

  // Defer until load so a deploy-in-progress does not fail SW install mid-precache.
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}