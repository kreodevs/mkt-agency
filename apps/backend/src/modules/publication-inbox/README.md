# Publication Inbox (Bandeja de publicación)

Hub operativo de la agencia autónoma: contenido sugerido por IA, aprobación del usuario y kit Copiar y Llevar.

## API (`/api/v1/publication-inbox`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/publication-inbox?productId=` | Bandeja: pendientes, listas, próximas, **rechazadas** + notificaciones |
| GET | `/publication-inbox/copilot-status?productId=` | Estado del copiloto (producto, competidores, análisis, bandeja) |
| POST | `/publication-inbox/prepare-week` | Encola orquestación (competidores → intel → estrategia → CM); body opcional `{ productId?, horizon?: 'day' \| 'week' }`; responde `202` + `jobId` |
| GET | `/publication-inbox/prepare-week/jobs/:jobId` | Estado del job (`processing` / `completed` / `failed`) |
| POST | `/publication-inbox/regenerate/:contentId` | Regenera copy + visual; body opcional `{ visualFormat?, feedback? }` |
| POST | `/publication-inbox/request-changes/:contentId` | Regenera con feedback `{ versionId, feedback }` |
| POST | `/publication-inbox/dismiss/:contentId` | Archiva pieza **rechazada** (alias de delete con validación de status) |
| POST | `/publication-inbox/delete/:contentId` | Elimina pieza (cualquier status, incl. aprobada y multi-versión) |
| POST | `/publication-inbox/bulk-delete` | Elimina múltiples `{ contentIds[] }` |
| POST | `/publication-inbox/purge` | Limpia por alcance `{ scope, productId? }` — `all` \| `pending` \| `ready` \| `rejected` \| `upcoming` |
| POST | `/publication-inbox/bulk-approve` | Aprueba múltiples contenidos `{ contentIds[] }` |
| POST | `/publication-inbox/publish/:contentId` | Dispara webhook n8n manual («Publicar con n8n») |
| POST | `/publication-inbox/webhook/:tenantId/mark-published` | **Público** — callback n8n para cerrar ciclo (`published_at`) |
| PATCH | `/publication-inbox/notifications/:id/read` | Marca notificación leída |
| PATCH | `/publication-inbox/notifications/read-all` | Marca todas leídas |

## Jobs (BullMQ + Redis)

| Cola | Cron | Acción |
|------|------|--------|
| `agency-weekly-run` | Lunes 06:00 | **Orquestación inteligente** por producto onboarded |
| `approval-reminder` | 09:00 + 23:00 UTC | Aprobación pendiente + **Hoy toca publicar** (`publish_reminder`) |

### Pipeline semanal (`AgencyOrchestrationService`)

Por cada producto activo:

1. **Métricas** — leads, contenido y campañas (`DashboardMetricsService`, filtrado por `productId`)
2. **Estrategia** — `StrategyService.triggerAnalysis` con métricas reales; auto-aplica sugerencias de contenido
3. **Community Manager** — genera copy usando `topics` de la estrategia
4. **Visual Studio** — plantillas de marca (Sharp + titular/CTA) con fotos del media kit; fallback IA con paleta e intel competitiva
5. **Notificación** — bandeja con resumen (posts + imágenes)

### Copiloto SOHO (`CopilotService` + `CopilotOrchestrationService`)

- `GET copilot-status` — siguiente paso sugerido y flags (`canPrepareWeek`)
- `POST prepare-week` — mismo pipeline que el cron semanal, disparado por el usuario. Body `horizon`:
  - `day` — 1 post (validación rápida del pipeline)
  - `week` — 5 posts (producción; default)
  1. Descubre competidores si hay &lt; 2
  2. Competitor Intel (espera hasta 120 s)
  3. `AgencyOrchestrationService.runWeeklyForProduct` con el conteo según `horizon`
  4. Notificación `week_ready` (email solo en `week`)

## Notificaciones

Tabla `agency_notifications`. Tipos: `week_ready`, `approval_reminder`, `publish_reminder`, `onboarding_complete`.

## Integración

- Onboarding producto → CM genera 7 posts → notificación + redirect a bandeja
- Frontend: `/` (tenant) = `PublicationInboxPage`
- Selector de producto activo: `ActiveProductSelector` + `useActiveProductStore`
- Sin webhook configurado en el producto → flujo manual copiar/pegar sin cambios
- Con webhook → botón «Publicar con n8n» + auto-dispatch opcional al aprobar
- Cierre de ciclo: n8n llama callback o usuario «Marcar publicado» / `POST /contents/:id/mark-published`
