# Páginas agencia

| Ruta | Componente | Perfil |
|------|------------|--------|
| `/agency/strategy` | `AgencyStrategyPage` | Growth |
| `/agency/activity` | `AgencyActivityPage` | SOHO + Growth |
| `/agency/media-intents` | `AgencyMediaIntentsPage` | Growth con pauta (`growth_paid`) |

Guards: `SohoLegacyRedirect` (strategy/media-intents), `PaidProfileRedirect` (solo media-intents).
