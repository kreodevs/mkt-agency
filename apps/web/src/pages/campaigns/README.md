# Campañas (US-009 frontend)

- `CampaignListPage` — `/campaigns` (tabla + Kanban, filtros, campaña automática desde agentes)
- `CampaignCreatePage` — `/campaigns/new`
- `CampaignDetailPage` — `/campaigns/:id` (orgánico: plan editorial + guía manual; pagado: estrategia IA + presupuestos)

Componentes en `@/components/campaigns/`: `CampaignKanban`, `BudgetApproval`, `StrategyGeneration`.

API: `@/services/campaigns.ts`
