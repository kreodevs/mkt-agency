# Bandeja de publicación (frontend)

Página principal del tenant en `/`. En **modo copiloto** (default SOHO) el usuario solo revisa, aprueba y copia/pega; el copiloto orquesta competidores, análisis y generación.

## Modo copiloto vs agencia

| Modo | Menú | Rutas legacy |
|------|------|----------------|
| Copiloto (default) | Inicio, **Resumen**, **Calendario**, Actividad agentes, **Agentes IA**, Inbox social, Leads, **Librería**, Mi producto, Ajustes | `/contents`, `/calendar`, `/community`, `/strategy`, `/dashboard` → `/` |
| Vista completa | 5 grupos: **Hoy**, Mi negocio, Crear con IA, Herramientas, Configuración | Rutas accesibles |

**Vista completa (avanzado):** flujo diario igual que copiloto en Inicio (preparar · aprobar · copiar). Menú extra para KPIs, métricas y herramientas manuales.

`/libreria` y `/calendario` en ambos modos. Toggle sidebar: «Cambiar a modo agencia (Growth)» / «Volver a copiloto (SOHO)» (cambia perfil operativo; ver tooltip).

## Archivos

Pantallas alineadas a tokens Kreo y moléculas `PageHeader`, `StatsCard`, `EmptyState`, `StatusPill`.

| Archivo | Rol |
|---------|-----|
| `pages/publication-inbox/PublicationInboxPage.tsx` | Vista hub + `CopilotStatusPanel` + tarjeta Agentes IA (SOHO) |
| `pages/publication-inbox/PublicationCalendarPage.tsx` | Calendario SOHO en `/calendario` (`useSohoCalendarMonth`) |
| `components/publication-inbox/SohoCalendarDayPanel.tsx` | Detalle del día con `InboxItemCard` |
| `components/publication-inbox/SohoCalendarLegend.tsx` | Leyenda de colores del calendario |
| `components/publication-inbox/InboxItemCard.tsx` | CTA «Copiar y publicar» + preview visual |
| `components/publication-inbox/InboxRejectFollowUpDialog.tsx` | Diálogo post-rechazo (otro formato / archivar) |
| `components/publication-inbox/RejectedInboxActions.tsx` | Acciones en sección Rechazadas |
| `components/publication-inbox/InboxItemVisualPreview.tsx` | Imagen/video/carrusel antes de aprobar |
| `components/publication-inbox/InboxKitPanel.tsx` | Kit Copiar y Llevar multi-día |
| `components/copilot/CopilotStatusPanel.tsx` | Estado pipeline + selector día/semana + preparar contenido |
| `components/copilot/CmCharacterSetupPanel.tsx` | Biblioteca de CMs virtuales (varias por producto) |
| `services/publication-inbox.ts` | Cliente API (incl. copilot-status, prepare-week con `horizon`, delete, bulk-delete, purge) |
| `store/copilot-ui.ts` | Persistencia modo avanzado |
| `lib/tenant-navigation.ts` | Nav SOHO vs avanzado |

Resumen KPIs: `/agency-overview` — **Resumen** en menú SOHO y Growth.

**Calendarios:** SOHO usa `/calendario` (menú **Calendario**); Growth también puede usar `/calendar` (calendario editorial avanzado). Ver `docs/ayuda/calendario/README.md`.
