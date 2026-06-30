# Campaign module

Campañas multicanal del tenant (US-009 backend).

## Rutas (`TenantGuard`)

| Recurso | Base |
|---------|------|
| Plantillas | `/api/v1/campaign-templates` |
| Campañas | `/api/v1/campaigns` |
| Audiencias | `/api/v1/audiences` |

## Orquestación desde agentes

- `GET /campaigns/agent-readiness` — prerrequisitos (perfil, Brand Analyst, Community Manager, Estrategia)
- `POST /campaigns/auto-generate` — crea campaña, lanza estrategia IA y vincula contenidos del CM

## IA asíncrona

- `POST /campaigns/:id/generate-strategy` → 202 + `assignmentId`
- Polling: `GET /campaigns/strategy-assignments/:assignmentId`
- Cola BullMQ `campaign-strategy` (Redis `REDIS_URL`)
- Adaptador: `OpenRouterStrategyAdapter` si `AI_API_KEY`, si no `StubStrategyAdapter`

## Presupuestos

- `GET /campaigns/:id/budgets`
- `PATCH /campaigns/:id/budgets/:budgetId` con `{ "approved": true|false }`
- Filas `proposed_by_ai` se regeneran en cada estrategia IA

## Entidades

`campaign_templates`, `campaigns`, `budgets`, `audiences`, `campaign_strategy_assignments`
