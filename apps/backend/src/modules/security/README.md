# Security

Eventos de seguridad (`security_events`) y alertas T-007.

## Flujo T-007

1. `SecurityEventRecorderService.record()` persiste el evento.
2. `SecurityAlertObserver` encola en `outbox` si `severity` es `high` o `critical`.
3. `AlertWorkerService` (cola `security-alert`, cada 30s) consume outbox y notifica vía Slack.

## Configuración

| Variable | Uso |
|----------|-----|
| `SLACK_SECURITY_WEBHOOK_URL` | Webhook Incoming Slack; si falta, solo log de advertencia |

## Eventos con alerta hoy

- `refresh_token_reuse` — `critical` (reuso de refresh token)
