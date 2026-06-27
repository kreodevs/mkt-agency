# PWA y auto-actualización

- **vite-plugin-pwa** con `registerType: 'autoUpdate'`: al detectar un nuevo service worker tras un deploy, activa la versión y recarga la pestaña.
- **`/version.json`**: generado en cada build con el hash del commit del deploy (`VITE_APP_VERSION`).
- **Polling cada 60s**: comprueba `version.json`; si cambia respecto a `localStorage`, fuerza `location.reload()` (respaldo si el SW tarda).

Registro en `main.tsx` → `initPwaUpdates()`.
