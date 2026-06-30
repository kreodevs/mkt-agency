# Publication Inbox (Bandeja de publicación)

Hub operativo de la agencia autónoma: contenido sugerido por IA, aprobación del usuario y kit Copiar y Llevar.

## API (`/api/v1/publication-inbox`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/publication-inbox?productId=` | Bandeja: pendientes, listas, próximas + notificaciones |
| POST | `/publication-inbox/bulk-approve` | Aprueba múltiples contenidos `{ contentIds[] }` |
| PATCH | `/publication-inbox/notifications/:id/read` | Marca notificación leída |
| PATCH | `/publication-inbox/notifications/read-all` | Marca todas leídas |

## Jobs (BullMQ + Redis)

| Cola | Cron | Acción |
|------|------|--------|
| `agency-weekly-run` | Lunes 06:00 | **Orquestación inteligente** por producto onboarded |
| `approval-reminder` | Diario 09:00 | Aviso si hay borradores programados en 48 h |

### Pipeline semanal (`AgencyOrchestrationService`)

Por cada producto activo:

1. **Métricas** — leads, contenido y campañas (`DashboardMetricsService`, filtrado por `productId`)
2. **Estrategia** — `StrategyService.triggerAnalysis` con métricas reales; auto-aplica sugerencias de contenido
3. **Community Manager** — genera copy usando `topics` de la estrategia
4. **Image Generator** — adjunta imagen por post (`visualDescription` → asset en versión del contenido)
5. **Notificación** — bandeja con resumen (posts + imágenes)

## Notificaciones

Tabla `agency_notifications`. Tipos: `week_ready`, `approval_reminder`, `onboarding_complete`.

## Integración

- Onboarding producto → CM genera 7 posts → notificación + redirect a bandeja
- Frontend: `/` (tenant) = `PublicationInboxPage`
- Selector de producto activo: `ActiveProductSelector` + `useActiveProductStore`
