# PWA y auto-actualización

- **vite-plugin-pwa** con `registerType: 'autoUpdate'`.
- **Workbox** con `skipWaiting: true` y `clientsClaim: true`: el SW nuevo toma control sin esperar a cerrar pestañas (evita depender de hard refresh).
- **`/version.json`**: hash del deploy (`VITE_APP_VERSION`); polling cada 60s como respaldo.
- Al detectar versión nueva: `registration.update()` + `SKIP_WAITING` + reload en `controllerchange`.

Registro en `main.tsx` → `initPwaUpdates()`.

Nginx (`infra/nginx/frontend.conf`) sirve `sw.js`, `workbox-*.js` y `version.json` con `Cache-Control: no-store`.
