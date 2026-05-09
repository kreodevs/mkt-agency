import { useEffect, useState, useCallback } from 'react';

const VERSION_CHECK_URL = '/version.json';
let swRegistration: ServiceWorkerRegistration | null = null;

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  // Registrar SW
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setChecking(false);
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        swRegistration = reg;

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;

          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch(() => {})
      .finally(() => setChecking(false));

    // Re-check when controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  return { updateAvailable, applyUpdate, checking };
}

// Version polling — cada 5 min verifica si hay build nuevo
export function useVersionPoll() {
  useEffect(() => {
    let cachedVersion: string | null = null;

    // Obtener version actual al montar
    fetch(VERSION_CHECK_URL + '?t=' + Date.now())
      .then((r) => r.json())
      .then((data) => { cachedVersion = data.version; })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const res = await fetch(VERSION_CHECK_URL + '?t=' + Date.now(), {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cachedVersion && data.version !== cachedVersion) {
          console.log(`[PWA] Nueva versión detectada: ${cachedVersion} → ${data.version}`);
          window.location.reload();
        }
      } catch {
        // ignore
      }
    }, 5 * 60 * 1000); // cada 5 minutos

    return () => clearInterval(interval);
  }, []);
}
