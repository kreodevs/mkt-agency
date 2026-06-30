import { registerSW } from 'virtual:pwa-register';

export function initPwaUpdates(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  const register = () => {
    registerSW({
      immediate: true,
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
