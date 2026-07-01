# Campaign module

Campañas multicanal del tenant (US-009 backend).

## Rutas (`TenantGuard`)

| Recurso | Base |
|---------|------|
| Plantillas | `/api/v1/campaign-templates` |
| Campañas | `/api/v1/campaigns` |
| Audiencias | `/api/v1/audiences` |

## Orquestación desde agentes

Dos modos de ejecución (`campaign.strategy.executionMode`):

| Modo | Uso | Generación |
|------|-----|------------|
| `organic` (default) | SoHo publica manualmente en redes | Campaña + contenidos CM + plan editorial. **Sin** estrategia IA ni presupuestos |
| `paid` | Cliente configura anuncios en Ads Manager | Campaña + estrategia IA + presupuestos + contenidos vinculados |

- `GET /campaigns/agent-readiness?mode=organic|paid` — prerrequisitos (Estrategia solo obligatoria en `paid`)
- `POST /campaigns/auto-generate` body `{ "mode": "organic" | "paid" }` — crea campaña según modo

## IA asíncrona

- `POST /campaigns/:id/generate-strategy` → 202 + `assignmentId`
- Polling: `GET /campaigns/strategy-assignments/:assignmentId`
- Cola BullMQ `campaign-strategy` (Redis `REDIS_URL`)
- Adaptador: `OpenRouterStrategyAdapter` si `AI_API_KEY`, si no `StubStrategyAdapter`

## Presupuestos

- `GET /campaigns/:id/budgets`
- `PATCH /campaigns/:id/budgets/:budgetId` con `{ "approved": true|false }`
- Filas `proposed_by_ai` se regeneran en cada estrategia IA

## Actualización de plataformas

- `PATCH /campaigns/:id` con `{ "platforms": [...] }` actualiza también `strategy.channels` (conserva `focus` por plataforma cuando existía).

## Contenidos desde Community Manager

- `POST /community-manager/generate` con `campaignId` crea contenidos programados y actualiza `strategy.linkedContentCount` + `strategy.timeline` de la campaña.

## Entidades

`campaign_templates`, `campaigns`, `budgets`, `audiences`, `campaign_strategy_assignments`
