# Componentes de campañas

- `CampaignKanban` — pipeline por estado (`draft` → `completed`), drag & drop vía Kreo `KanbanBoard`
- `CampaignAgentReadinessPanel` — selector orgánico/pagado, checklist horizontal de agentes (grid responsive) + `POST /campaigns/auto-generate`
- `CampaignPlatformEditor` — edición inline de plataformas en detalle (`PATCH /campaigns/:id`; sincroniza `strategy.channels` en backend)
- `CampaignGeneratePosts` — genera copy CM vinculado a la campaña (`POST /community-manager/generate` con `campaignId`)
- `OrganicPublishingGuide` — flujo Calendario → Aprobar → Copiar y Llevar (modo `organic`) + generación de posts
- `BudgetApproval` — aprobar/rechazar presupuesto (`PATCH .../budgets/:id`, solo modo `paid`)
- `StrategyGeneration` — `POST generate-strategy` + polling (solo modo `paid`)
