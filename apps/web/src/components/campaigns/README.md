# Componentes de campañas

- `CampaignKanban` — pipeline por estado (`draft` → `completed`), drag & drop vía Kreo `KanbanBoard`
- `CampaignAgentReadinessPanel` — selector orgánico/pagado, checklist de agentes + `POST /campaigns/auto-generate`
- `OrganicPublishingGuide` — flujo Calendario → Aprobar → Copiar y Llevar (modo `organic`)
- `BudgetApproval` — aprobar/rechazar presupuesto (`PATCH .../budgets/:id`, solo modo `paid`)
- `StrategyGeneration` — `POST generate-strategy` + polling (solo modo `paid`)
