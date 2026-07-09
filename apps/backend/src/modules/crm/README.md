# CRM (US-014)

Pipeline de leads con scoring IA (Strategy: stub o OpenRouter si `AI_API_KEY`).

## Endpoints

| Método | Ruta |
|--------|------|
| GET | `/api/v1/leads` |
| POST | `/api/v1/leads` |
| GET | `/api/v1/leads/:id` |
| PATCH | `/api/v1/leads/:id` |
| PATCH | `/api/v1/leads/:id/stage` |
| DELETE | `/api/v1/leads/:id` |
| GET | `/api/v1/leads/:id/interactions` |

`DELETE` responde 409 si existen propuestas firmadas (`proposals.signature_hash`).

## Comandos

- `SubmitFormHandler` — captura desde formularios (US-013)
- `AddInteractionHandler` — interacción + recálculo de score
- `DeleteLeadHandler` — eliminación con validación
