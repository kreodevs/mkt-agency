# Auditoría UX — Mkt Agency OS (pantallas completas)

**Fecha:** 2026-08-03  
**Alcance:** `apps/web` — todas las rutas del router  
**Perfil prioritario:** SOHO copiloto  
**Tokens:** `apps/web/src/theme/vars.css`, `docs/sdd/ux-ui-guide.md`

---

## Resumen ejecutivo

La app SOHO (bandeja `/`, calendario, producto, librería) ya tenía una base sólida con `DashboardShell`, `PageHeader`, `EmptyState` y flujo inbox→aprobar→publicar. Los principales gaps eran: **auth sin branding**, **tablas desktop en productos**, **CTAs Growth visibles en SOHO**, **espaciado ad-hoc** y **mobile header actions** apretados.

Esta iteración corrige **P0** y quick wins **P1** en las pantallas de mayor uso. Superadmin y agentes avanzados quedan documentados como backlog P2.

---

## Matriz pantalla × severidad

| Pantalla | Ruta | Perfil | Severidad | Estado post-audit |
|----------|------|--------|-----------|-------------------|
| Bandeja / Inicio | `/` | SOHO | P1 | Mejorado — CTA destructivo oculto en SOHO |
| Calendario publicación | `/calendario` | SOHO | P0 | **Rediseñado** — EmptyState, tokens, error state |
| Productos listado | `/products` | SOHO | P0 | **Rediseñado** — cards SOHO/mobile |
| Producto detalle | `/products/:id` | SOHO | P0 | **Rediseñado** — skeleton, empty, sin campaña/n8n SOHO |
| Librería | `/libreria` | SOHO | P1 | Mejorado — navegación SPA, spacing tokens |
| Leads | `/leads` | SOHO | P1 | Mejorado — copy «Contactos», filtro fuera del header |
| Login | `/login` | Público | P0 | **Rediseñado** — AuthShell branded |
| Setup | `/setup` | Público | P0 | **Rediseñado** — AuthShell + skeleton carga |
| DashboardShell / nav | layout | Todos | P1 | Mejorado — impersonation sticky, PageHeader wrap |
| Ajustes copiloto | `/settings/copilot` | SOHO | P2 | OK estructura; revisar densidad mobile |
| Onboarding tenant | `/onboarding` | SOHO | P2 | Wizard funcional; unificar copy SOHO |
| Actividad agentes | `/agency/activity` | SOHO | P2 | Copy SOHO presente; timeline denso en móvil |
| Inbox social | `/social/inbox` | SOHO | P2 | Guía SOHO ok; split pane estrecho <768px |
| Formularios | `/forms` | SOHO | P2 | DataTable sin card mobile |
| Resumen agencia | `/agency-overview` | Growth | P2 | KPIs ok; no SOHO-first |
| Métricas | `/dashboard` | Growth | P2 | Legacy redirect ok |
| Campañas list/create/detail | `/campaigns/*` | Growth | P2 | DataTable denso; fuera scope SOHO |
| Contenidos | `/contents/*` | Growth | P2 | Editor ok; nav solo Growth |
| Calendario editorial | `/calendar` | Growth | P2 | Duplica concepto con `/calendario` — doc UX |
| Estrategia | `/strategy`, `/agency/strategy` | Growth | P2 | OK para power users |
| Community Manager | `/community` | Growth | P2 | Formulario largo; mobile scroll |
| Agentes list | `/agents` | Growth | P2 | Grid cards aceptable |
| Brand interview | `/agents/brand-interview` | Agente | P2 | Errores con `red-*` Tailwind (no tokens) |
| Competitor intel | `/agents/competitor-intel` | Agente | P2 | Idem colores ad-hoc |
| Image generator | `/agents/image-generator` | Agente | P2 | OK general |
| Propuestas | `/proposals/*` | Otros | P2 | Tabla + detalle estándar |
| Reportes | `/reports/*` | Otros | P2 | Tabla estándar |
| Captura pública | `/c/:formId` | Público | P2 | Color form dinámico ok; error `text-red-600` |
| Tenants | `/tenants` | Superadmin | P2 | Funcional; no rediseño |
| Admin LLM/Audit/Users | `/admin/*` | Superadmin | P2 | Colores ad-hoc en badges (`purple`, `gray`) |
| Dominio / Competidores | `/settings/*` | Mixto | P2 | Formularios estándar |

**Leyenda severidad:** P0 = bloquea uso SOHO/mobile o rompe confianza; P1 = fricción notable; P2 = polish / Growth / superadmin.

---

## Problemas por categoría

### Jerarquía visual

| Problema | Pantallas | Severidad |
|----------|-----------|-----------|
| CTAs Growth (campaña, n8n) competían con flujo copiloto | ProductList, ProductDetail | P0 → corregido |
| «Limpiar contenido» destructivo visible en bandeja SOHO | PublicationInbox | P1 → oculto SOHO |
| Stats duplicados (banner + cards) en inbox SOHO | PublicationInbox | P2 — aceptable |
| Título «Pipeline CRM» jerga B2B | LeadPipeline | P1 → «Contactos» SOHO |

### CTAs

| Problema | Pantallas | Severidad |
|----------|-----------|-----------|
| Login/setup sin propuesta de valor | Auth | P0 → AuthShell |
| Empty states sin acción clara | Calendar, Products | P0 → EmptyState + CTA |
| Empty librería usaba `window.location` | AssetLibrary | P1 → `navigate` |

### Mobile

| Problema | Pantallas | Severidad |
|----------|-----------|-----------|
| DataTable productos ilegible <768px | ProductList | P0 → ProductListCard |
| Header actions sin wrap | PageHeader (global) | P1 → flex-wrap |
| Filtro producto en header leads | LeadPipeline | P1 → fila dedicada |
| Kanban leads: sheet mobile ya existe | LeadPipeline | OK |

### Consistencia navegación

| Problema | Pantallas | Severidad |
|----------|-----------|-----------|
| SOHO nav 8 ítems — denso pero alineado a hábitos | tenantSohoNavigation | P2 |
| Toggle Growth/SOHO en sidebar footer | DashboardShell | OK |
| Impersonación no sticky — se perdía al scroll | ImpersonationContextBar | P1 → sticky |
| Superadmin «Inicio» apunta a `/` (bandeja tenant) | superadminNavigation | P2 — conocido |

### Empty states

| Pantalla | Antes | Después |
|----------|-------|---------|
| `/calendario` | Card texto plano | EmptyState + icono + CTA |
| `/products` | Card con botones | EmptyState unificado |
| `/products/:id` error | Card mínima | EmptyState + acción |
| `/libreria` | EmptyState ok | CTA SPA |

### Accesibilidad

| Problema | Acción |
|----------|--------|
| Login password sin `htmlFor` | Corregido — ids + labels |
| Impersonation sin live region | `role="status"` + `aria-live="polite"` |
| Safe area iOS en auth | AuthShell con `--safe-area-*` |
| Focus visible en links auth | `focus-visible:ring` |

---

## Qué NO tocar (ya bien)

- **PublicationInboxPage** — flujo Preparar→Revisar→Publicar, `TodayPublishPanel`, `InboxItemCard` SOHO, notificaciones browser.
- **SohoCalendarDayPanel + Legend** — copy claro, acciones copiar/publicar.
- **AppLayout** — drawer mobile, swipe edge, campana avisos.
- **tenantSohoNavigation** — agrupación Copiloto coherente con producto.
- **CopilotSettingsPage** — toggle perfil operativo.
- **SocialInboxPage** — variant SOHO en guía.
- **Componentes atoms/molecules** — Button, Card, StatsCard, StatusPill usan tokens.
- **PublicCapturePage** — formulario público aislado (brand por tenant).

---

## Cambios implementados (2026-08-03)

### Nuevos componentes

- `components/layout/AuthShell.tsx`
- `components/products/ProductListCard.tsx`

### Archivos modificados

- `pages/auth/LoginPage.tsx`
- `pages/setup/SetupPage.tsx`
- `pages/publication-inbox/PublicationInboxPage.tsx`
- `pages/publication-inbox/PublicationCalendarPage.tsx`
- `pages/products/ProductListPage.tsx`
- `pages/products/ProductDetailPage.tsx`
- `pages/assets/AssetLibraryPage.tsx`
- `pages/crm/LeadPipelinePage.tsx`
- `components/molecules/PageHeader.tsx`
- `components/molecules/PageSkeleton.tsx` (+ ProductPageSkeleton)
- `components/layout/ImpersonationContextBar.tsx`
- `components/layout/README.md`
- `components/products/README.md`

---

## Backlog P2 (siguiente iteración)

1. ~~**MobileStackView** para DataTables restantes (`/forms`, `/campaigns`, admin).~~ — `/forms` con `FormListCard`; campañas/admin pendiente.
2. ~~**Unificar calendarios** — documentar diferencia `/calendario` (SOHO) vs `/calendar` (editorial Growth).~~ — ver `components/publication-inbox/README.md`.
3. ~~**Agentes** — reemplazar `red-*` / `purple-*` Tailwind por `--destructive` / tokens.~~
4. ~~**Superadmin** — revisar nav «Inicio» → dashboard propio; badges con StatusPill.~~ — «Panel» → `/tenants`.
5. ~~**PublicationInbox** — colapsar stats cuando `SohoResultsBanner` visible.~~
6. ~~**FormListPage** — empty state + card mobile.~~
7. ~~**OnboardingWizardPage** — progress indicator más visible en móvil.~~
8. ~~**PublicCapturePage** — error con `--destructive` en lugar de `text-red-600`.~~

### P3 (futuro)

- Mobile cards para `/campaigns` y tablas admin restantes.
- Tokens en gradientes violeta de BrandInterview (spinner IA).

---

## Criterios de aceptación cumplidos

- [x] Matriz pantalla × severidad
- [x] Problemas documentados (jerarquía, CTAs, mobile, nav, empty states)
- [x] Qué no tocar
- [x] P0 + quick wins P1 en pantallas SOHO prioritarias
- [x] Tokens CSS existentes (sin colores ad-hoc nuevos)
- [x] API intacta
- [x] READMEs de carpetas tocadas
