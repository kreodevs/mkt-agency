# Páginas agencia

| Ruta | Componente | Perfil |
|------|------------|--------|
| `/agency/strategy` | `AgencyStrategyPage` | Growth |
| `/agency/activity` | `AgencyActivityPage` | SOHO + Growth |
| `/agency/media-intents` | `AgencyMediaIntentsPage` | Growth con pauta (`growth_paid`) |

Eventos en `/agency/activity` enlazan al artefacto según tipo (`lib/agent-event-navigation.ts`).

Guards: `SohoLegacyRedirect` (strategy/media-intents; **no** aplica a `/agents`), `PaidProfileRedirect` (solo media-intents).
