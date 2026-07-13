# Bandeja de publicación (frontend)

Página principal del tenant en `/`. En **modo copiloto** (default SOHO) el usuario solo revisa, aprueba y copia/pega; el copiloto orquesta competidores, análisis y generación.

## Modo copiloto vs agencia

| Modo | Menú | Rutas legacy |
|------|------|----------------|
| Copiloto (default) | Inicio, **Calendario**, **Librería**, Mi producto, Ajustes | `/contents`, `/calendar`, `/community`, `/strategy`, `/dashboard` → `/` |
| Vista completa | 5 grupos: **Hoy**, Mi negocio, Crear con IA, Herramientas, Configuración | Rutas accesibles |

**Vista completa (avanzado):** flujo diario igual que copiloto en Inicio (preparar · aprobar · copiar). Menú extra para KPIs, métricas y herramientas manuales.

`/libreria` y `/calendario` en ambos modos. Toggle sidebar: «Ver todas las herramientas» / «Vista simple (copiloto)».

## Archivos

Pantallas alineadas a tokens Kreo y moléculas `PageHeader`, `StatsCard`, `EmptyState`, `StatusPill`.

| Archivo | Rol |
|---------|-----|
| `pages/publication-inbox/PublicationInboxPage.tsx` | Vista hub + `CopilotStatusPanel` |
| `pages/publication-inbox/PublicationCalendarPage.tsx` | Calendario SOHO en `/calendario` (`useSohoCalendarMonth`) |
| `components/publication-inbox/SohoCalendarDayPanel.tsx` | Detalle del día con `InboxItemCard` |
| `components/publication-inbox/SohoCalendarLegend.tsx` | Leyenda de colores del calendario |
| `components/publication-inbox/InboxItemCard.tsx` | CTA «Copiar y publicar» + preview visual |
| `components/publication-inbox/InboxRejectFollowUpDialog.tsx` | Diálogo post-rechazo (otro formato / archivar) |
| `components/publication-inbox/RejectedInboxActions.tsx` | Acciones en sección Rechazadas |
| `components/publication-inbox/InboxItemVisualPreview.tsx` | Imagen/video/carrusel antes de aprobar |
| `components/publication-inbox/InboxKitPanel.tsx` | Kit Copiar y Llevar multi-día |
| `components/copilot/CopilotStatusPanel.tsx` | Estado pipeline + preparar semana |
| `components/copilot/CmCharacterSetupPanel.tsx` | Biblioteca de CMs virtuales (varias por producto) |
| `services/publication-inbox.ts` | Cliente API (incl. copilot-status, prepare-week, delete, bulk-delete, purge) |
| `store/copilot-ui.ts` | Persistencia modo avanzado |
| `lib/tenant-navigation.ts` | Nav SOHO vs avanzado |

Resumen KPIs legacy: `/agency-overview` (solo modo avanzado en sidebar).
