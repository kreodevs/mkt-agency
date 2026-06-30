# PWA y auto-actualización

- **vite-plugin-pwa** con `registerType: 'autoUpdate'` — único mecanismo de actualización (sin polling).
- **`index.html` no se precachea** — NetworkFirst en navegaciones; evita HTML viejo con poller inline en iOS.
- **`version.json`** solo informativo (`build`, `builtAt`); el cliente ya no lo consulta.
- **Migración one-shot** en `index.html`: desregistra SW + borra caches una vez (`localStorage mkt:pwa-reset:v5`).

Registro en `main.tsx` → `initPwaUpdates()`.

Nginx sirve `sw.js`, `workbox-*.js` y `version.json` con `Cache-Control: no-store`.
