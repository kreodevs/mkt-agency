# Social Inbox module

Bandeja de interacciones sociales (sin integración Meta OAuth). Ingesta manual autenticada o webhook genérico.

## API

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/v1/social-inbox` | JWT tenant |
| POST | `/api/v1/social-inbox/ingest` | JWT tenant |
| PATCH | `/api/v1/social-inbox/:id/replied` | JWT tenant |
| POST | `/api/v1/social-inbox/webhook/:tenantId` | `@Public()` + header `X-Webhook-Secret` |
| GET | `/api/v1/tenant/webhook-info` | JWT tenant (genera secret si falta) |

## Flujo

1. Clasificación de intención (reglas + LLM fallback)
2. Prospectos → lead en CRM (`firstTouchSource`/`lastTouchSource`: `social`) + evento `QualifiedLeadBatch`
3. Resto → `SentimentSignal` para creativo

## Agente

Community & Lead Qualifier (`AgentRole.COMMUNITY`) — activo en perfiles SOHO lite y Growth.
