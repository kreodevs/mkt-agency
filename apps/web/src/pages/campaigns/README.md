# Campañas (US-009 frontend)

- `CampaignListPage` — `/campaigns` (tabla + Kanban, filtros, campaña automática desde agentes)
- `CampaignCreatePage` — `/campaigns/new`
- `CampaignDetailPage` — `/campaigns/:id` (estrategia, presupuestos, IA)

Componentes en `@/components/campaigns/`: `CampaignKanban`, `BudgetApproval`, `StrategyGeneration`.

API: `@/services/campaigns.ts`
