# PWA y auto-actualización

- **vite-plugin-pwa** con `registerType: 'autoUpdate'` (un solo flujo de reload vía Workbox).
- **`/version.json`**: polling en `registerPwa.ts` con timeout 8s; **NetworkOnly** (no pasa por caché del SW).
- **Sin script inline en `index.html`**: evita doble reload + `unregister()` que ciclaba en iOS Safari.
- **Sin listener `controllerchange`**: `autoUpdate` ya recarga; duplicarlo provocaba bucles.
- Recarga forzada sin SW: máximo una vez por versión (`sessionStorage`).

Registro en `main.tsx` → `initPwaUpdates()`.

Nginx sirve `sw.js`, `workbox-*.js` y `version.json` con `Cache-Control: no-store`.
