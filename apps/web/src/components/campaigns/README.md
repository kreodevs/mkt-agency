# Componentes de campañas

- `CampaignKanban` — pipeline por estado (`draft` → `completed`), drag & drop vía Kreo `KanbanBoard`
- `BudgetApproval` — aprobar/rechazar presupuesto (`PATCH .../budgets/:id`)
- `StrategyGeneration` — `POST generate-strategy` + polling de asignación
- `CampaignAgentReadinessPanel` — checklist de agentes + botón `POST /campaigns/auto-generate`
