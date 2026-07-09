# Agency Agents module

Capa modular de agentes de agencia con perfiles operativos **SOHO** vs **Growth** y activación por presupuesto.

## Perfiles

| Subperfil | Usuario | Agentes activos |
|-----------|---------|-----------------|
| `soho` | Publica manualmente en redes | Strategist lite, Analytics lite, Creative full |
| `growth_organic` | Campañas sin pauta | + Strategist standard, sin Media Buyer |
| `growth_paid` | Presupuesto ads declarado | Todos incl. Media Buyer |

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/tenant/operating-profile` | Perfil + matriz de capacidades |
| PATCH | `/api/v1/tenant/operating-profile` | Actualizar perfil / presupuesto |
| GET | `/api/v1/agency/events` | Log de eventos inter-agente |
| GET | `/api/v1/agency/performance` | Resumen leads (Analytics lite) |
| GET | `/api/v1/agency/anomalies` | Alertas semanales |
| GET | `/api/v1/agency/attribution` | MTA lite (`first_touch` / `last_touch`) |
| GET | `/api/v1/agency/creative-packs` | Packs persistidos |
| GET/POST | `/api/v1/agency/plans` | Planes estrategia (solo Growth) |
| POST | `/api/v1/agency/plans/:id/approve` | Aprueba plan → eventos Creative/Media |

## Guards

- `GrowthProfileGuard` — bloquea campañas y planes si perfil SOHO
- `PaidBudgetGuard` — bloquea estrategia IA de pauta y presupuestos sin `adBudget` activo

## Tablas

- `agent_event_log` — trazabilidad del ciclo cerrado
- `agent_plans` — planes del Business Strategist
- `creative_packs` — salida del Creative Director (JSON payload)

## Módulos relacionados

- `paid-media/` — Media Buyer stub → `media_campaign_intents` (sin Meta/Google API)
- `social-inbox/` — Community agent + webhook genérico

## Integración SOHO

`AgencyOrchestrationService` emite eventos `ContentPlanReady`, `ContentBrief`, `SohoWeekPrepared` en el pipeline semanal existente.

## Cron

| Cola | Horario | Acción |
|------|---------|--------|
| `weekly-balance` | Lunes 07:00 | Analytics → PerformanceReport + anomalías; Strategist → WeeklyBalance (Growth) |

## Agentes adicionales

- `CreativeAgentService` — genera `CreativePack`, persiste en DB y dispara Media Buyer stub
- `AnalyticsAgentService.detectAnomalies` — caídas/spikes de leads sin APIs de ads
- `AnalyticsAgentService.getAttributionReport` — first/last touch desde metadata de leads
