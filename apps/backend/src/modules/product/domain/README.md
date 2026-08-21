# Manifest de captura (`tutorial-manifest.util.ts`)

Parser **genérico** para JSON de guía de captura. No está acoplado a OralTrack: normaliza variantes comunes antes de Playwright.

## URL del manifest

- Campo producto: `products.metadata.appCaptureManifestUrl` → API `PATCH /products/:id/app-capture` `{ manifestUrl }`.
- Si **vacío**: fallback `{origen-de-appUrl}/tutorial-manifest.json`.
- Si **configurado**: se usa esa URL exacta (otras apps, CDN, otro path).

## Formato soportado (normalizado internamente)

### Requerido

| Campo | Alias aceptados |
|-------|-----------------|
| Base URL | `baseUrl`, `base_url`, `appBaseUrl`, `origin`, `app.baseUrl` |
| Pantallas | array `modules`, `pages`, `screens`, `routes` o `views` |

Cada pantalla:

| Concepto | Alias |
|----------|--------|
| Título | `title`, `name`, `label`, `screenName` |
| ID | `navId`, `id`, `key`, `slug` |
| Ruta | `path`, `route`, `slug`, `pathname` |
| URL absoluta | `url`, `href`, `fullUrl` |
| Espera | `waitSelector`, `waitFor`, `readySelector`, `selector` |
| Flujo | `flow`, `steps`, `actions` |
| Omitir | `disabled`, `skip`, `hidden`, `capture: false` |

### Login (uno de)

1. Bloque `login` / `auth` / `authentication` con `flow[]` o `steps[]`
2. `login.emailSelector` + `passwordSelector` + `submitSelector` (+ `path`)
3. Módulo con `path: /login` y `flow` (estilo OralTrack)

### Prioridad de capturas

`preferredScreens`, `captureOrder`, `featuredModules`, `priority`, o `coverageNotes.microTutorialesActivos`.

### Rutas excluidas

`authPaths` en manifest + defaults (`/login`, `/sign-in`, …). Se omiten paths dinámicos (`:id`, `/detalle`, `/admin`).

## OralTrack

`https://app.oraltrack.com.mx/tutorial-manifest.json` encaja sin adaptación: `modules[]`, `flow`, `coverageNotes.microTutorialesActivos`.

## Ejemplo mínimo (otra app)

```json
{
  "baseUrl": "https://saas.example.com",
  "preferredScreens": ["home", "billing"],
  "login": {
    "path": "/sign-in",
    "emailSelector": "#email",
    "passwordSelector": "#password",
    "submitSelector": "button[type=submit]"
  },
  "pages": [
    { "id": "home", "title": "Inicio", "path": "/home", "waitSelector": "[data-page=home]" },
    { "id": "billing", "title": "Facturación", "path": "/billing" }
  ]
}
```

Tests: `tutorial-manifest.util.spec.ts`.
