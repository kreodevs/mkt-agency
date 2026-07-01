# PWA y auto-actualización

## Instalación

- **vite-plugin-pwa** genera `manifest.webmanifest`, `sw.js` y precache de assets hashed.
- Metadatos iOS/Android en `index.html` (`apple-mobile-web-app-*`, `manifest`, iconos).
- Icono: `public/favicon.svg` (192 + 512 en manifest).

## Actualización tras cada deploy

| Capa | Comportamiento |
|------|----------------|
| **Build** | `version.json` + `VITE_APP_VERSION` = commit Dokploy (`Dockerfile.frontend`) |
| **Nginx** | `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `index.html`, `version.json` → `Cache-Control: no-store` |
| **Workbox** | `registerType: autoUpdate`, `skipWaiting`, `clientsClaim`; `index.html` **no** precacheado |
| **Cliente** | `initPwaUpdates()` en `main.tsx` |

### Mecanismos en el cliente (`registerPwa.ts`)

1. **Registro SW** con `immediate: true` — Workbox recarga al detectar versión nueva.
2. **Comprobación periódica** cada 30 min (`registration.update()`).
3. **Al volver a la pestaña** (`visibilitychange` → visible).
4. **Chunks obsoletos** — listener `vite:preloadError` recarga tras deploy con app abierta.

No hay polling a `version.json` (legacy eliminado); el service worker es la fuente de verdad.

## Migración one-shot

`index.html` desregistra SW antiguo una vez (`localStorage mkt:pwa-reset:v5`).

## Desarrollo

PWA desactivada en dev (`devOptions.enabled: false`). Probar en build de producción local:

```bash
yarn workspace @mkt-agency/web build && yarn workspace @mkt-agency/web preview
```
