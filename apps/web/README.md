# @mkt-agency/web

Frontend React (Vite) con componentes **Kreo UI** (workflow DEV MCP).

## Stack

- React 18 + Vite 6 + TypeScript
- Tailwind CSS 3.4 + tokens Kreo (`src/theme/vars.css`)
- React Router v6 (lazy routes)
- TanStack Query + Zustand (JWT solo en memoria)

## Scripts

```bash
yarn dev      # http://localhost:5173 (proxy /api → backend :3000)
yarn build
```

## PWA y actualizaciones

- Instalable como PWA (`manifest.webmanifest`, icono `public/favicon.svg`).
- Cada build genera `version.json` con el **commit git** (`VITE_APP_VERSION`).
- Tras un deploy nuevo, la app **se recarga sola** (service worker `autoUpdate` + polling de `version.json` cada 60s).
- Detalle: `src/pwa/README.md`

## Componentes Kreo instalados

| Componente | Ruta |
|---|---|
| Button | `@/components/atoms/Button` |
| InputText | `@/components/atoms/InputText` |
| Password | `@/components/atoms/Password` |
| Avatar | `@/components/atoms/Avatar` |
| Card | `@/components/molecules/Card` |
| PageHeader | `@/components/molecules/PageHeader` |
| Sonner | `@/components/molecules/Sonner` |
| Tooltip | `@/components/molecules/Tooltip` |
| DataTable | `@/components/organisms/DataTable` |
| StatusPill | `@/components/atoms/StatusPill` |
| Checkbox | `@/components/atoms/Checkbox` |
| AppLayout | `@/components/organisms/AppLayout` |
| SidebarModern | `@/components/organisms/SidebarModern` |

## Páginas

- `/setup` — bootstrap superadmin (US-001)
- `/login` — auth JWT (US-004)
- `/` — dashboard (superadmin: acceso rápido a tenants)
- `/tenants` — listado superadmin con DataTable Kreo
- `/onboarding` — wizard company-profile (usuarios tenant)
