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
| GET/POST | `/api/v1/agency/plans` | Planes estrategia (solo Growth) |
| POST | `/api/v1/agency/plans/:id/approve` | Aprueba plan → eventos Creative/Media |

## Guards

- `GrowthProfileGuard` — bloquea campañas y planes si perfil SOHO
- `PaidBudgetGuard` — bloquea estrategia IA de pauta y presupuestos sin `adBudget` activo

## Tablas

- `agent_event_log` — trazabilidad del ciclo cerrado
- `agent_plans` — planes del Business Strategist

## Integración SOHO

`AgencyOrchestrationService` emite eventos `ContentPlanReady`, `ContentBrief`, `SohoWeekPrepared` en el pipeline semanal existente.
