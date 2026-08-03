# Outbox dispatcher

Publicación confiable de eventos de dominio escritos en la tabla `outbox`.

## Flujo

1. Comandos persisten filas `outbox` con `status=pending` en la misma transacción (content, company-profile, proposals, security).
2. `OutboxDispatcherWorkerService` programa un job BullMQ cada **30s** (`QUEUE_OUTBOX_DISPATCH`).
3. `OutboxDispatcherService` enruta por `eventType` al handler registrado y marca `processed`.

## Handlers

| eventType | Handler | Acción |
|-----------|---------|--------|
| `SecurityAlert` | `SecurityAlertOutboxHandler` | Slack / log |
| `ProposalSigned` | `ProposalSignedOutboxHandler` | Webhook Hermes si `HERMES_WEBHOOK_URL` |
| `CompanyProfileCompleted` | `CompanyProfileCompletedOutboxHandler` | Log estructurado |
| `ContentApproved` | `ContentApprovedOutboxHandler` | Log estructurado |

Eventos sin handler permanecen `pending` hasta registrarse.
