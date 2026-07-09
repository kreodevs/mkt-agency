# Social Inbox module

Bandeja de interacciones sociales (sin integración Meta por ahora). Ingesta manual o vía webhook futuro.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/social-inbox` | Listar interacciones |
| POST | `/api/v1/social-inbox/ingest` | Registrar comentario/DM simulado |
| PATCH | `/api/v1/social-inbox/:id/replied` | Marcar como respondido |

## Flujo

1. Clasificación de intención (reglas + LLM fallback)
2. Prospectos → lead en CRM + evento `QualifiedLeadBatch`
3. Resto → `SentimentSignal` para creativo

## Agente

Community & Lead Qualifier (`AgentRole.COMMUNITY`) — activo en perfiles SOHO lite y Growth.
