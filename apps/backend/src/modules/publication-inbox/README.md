# Publication Inbox (Bandeja de publicación)

Hub operativo de la agencia autónoma: contenido sugerido por IA, aprobación del usuario y kit Copiar y Llevar.

## API (`/api/v1/publication-inbox`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/publication-inbox?productId=` | Bandeja: pendientes, listas, próximas, **rechazadas** + notificaciones |
| GET | `/publication-inbox/copilot-status?productId=` | Estado del copiloto (producto, competidores, análisis, bandeja) |
| POST | `/publication-inbox/prepare-week` | Encola orquestación (competidores → intel → estrategia → CM); responde `202` + `jobId` |
| GET | `/publication-inbox/prepare-week/jobs/:jobId` | Estado del job (`processing` / `completed` / `failed`) |
| POST | `/publication-inbox/regenerate/:contentId` | Regenera copy + visual; body opcional `{ visualFormat?, feedback? }` |
| POST | `/publication-inbox/request-changes/:contentId` | Regenera con feedback `{ versionId, feedback }` |
| POST | `/publication-inbox/dismiss/:contentId` | Archiva pieza **rechazada** (elimina de la bandeja) |
| POST | `/publication-inbox/bulk-approve` | Aprueba múltiples contenidos `{ contentIds[] }` |
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
4. **Image Generator** — adjunta imagen por post (`visualDescription` → asset en versión del contenido)
5. **Notificación** — bandeja con resumen (posts + imágenes)

### Copiloto SOHO (`CopilotService` + `CopilotOrchestrationService`)

- `GET copilot-status` — siguiente paso sugerido y flags (`canPrepareWeek`)
- `POST prepare-week` — mismo pipeline que el cron semanal, disparado por el usuario:
  1. Descubre competidores si hay &lt; 2
  2. Competitor Intel (espera hasta 120 s)
  3. `AgencyOrchestrationService.runWeeklyForProduct`
  4. Notificación `week_ready`

## Notificaciones

Tabla `agency_notifications`. Tipos: `week_ready`, `approval_reminder`, `publish_reminder`, `onboarding_complete`.

## Integración

- Onboarding producto → CM genera 7 posts → notificación + redirect a bandeja
- Frontend: `/` (tenant) = `PublicationInboxPage`
- Selector de producto activo: `ActiveProductSelector` + `useActiveProductStore`
