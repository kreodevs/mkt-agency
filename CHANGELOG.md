# Changelog

## [0.2.2] — 2026-06-30

### Added

- **Hub de agentes con historial**: `/agents` muestra estado por agente (en progreso, completadas, sin ejecuciones) y botones contextuales — **Ver historial**, **Continuar**, **Último resultado** o **Iniciar** según corresponda (`useAgentHubStats`).
- **Brand Analyst — hub**: historial de entrevistas arriba; **Iniciar entrevista** / continuar abajo. Resultado en markdown con Kreo `MarkdownEditor` (readOnly).
- **Competitor Intel — historial**: listado de análisis con enlace al reporte (`?analysis=id`); formulario de **nuevo análisis** al final.
- **Image Generator — hub**: galería de imágenes arriba; formulario **Generar otra imagen** abajo.
- **Reintento de Brand Brief**: `POST /agents/interviews/:id/retry-brief` y botón en UI cuando la generación falla.

### Fixed

- **Brand Brief tras onboarding completado**: el worker ya no falla con `ConflictException` al actualizar el perfil; usa `mergeFromBrandBrief` en lugar de `updateProfile`.
- **Mensajes de error del worker**: textos legibles vía `formatWorkerErrorMessage` (sin "Conflict Exception" crudo).
- **Recuperación de brief**: si el JSON ya se generó, el reintento finaliza sin volver a llamar al LLM.

### Changed

- Páginas hub de agentes documentadas en `apps/web/src/pages/agents/README.md`.
- Componentes `BrandInterviewHistory` y `CompetitorIntelHistory` en `components/agents/`.

## [0.2.1] — 2026-06-28

### Changed

- **Impersonación ahora con select de usuarios**: Reemplazado el input de UUID por un dropdown que lista los usuarios del tenant seleccionado. El superadmin elige visualmente a quién impersonar.
  - Nuevo endpoint `GET /superadmin/tenants/:id/users` que retorna usuarios de un tenant
  - Método `findByTenantId` en `UserRepositoryPort` + implementación TypeORM
  - Frontend: `ImpersonateTenantModal` ahora usa `useQuery` para cargar usuarios y `<select>` para elegir

## [0.2.0] — 2026-06-28

### Added

- **Competitor Intel agent**: New deep-competitor-analysis agent with async processing
  - `AgentCompetitorAnalysisEntity` (tenant-scoped, JSONB analysis result)
  - `POST /agents/competitor-intel` + `GET /agents/competitor-intel` + `GET /agents/competitor-intel/:id`
  - OpenRouter + Stub adapters for competitive landscape generation
  - New LLM task type `competitor_intel` (configurable via superadmin)
  - Frontend: `/agents/competitor-intel` page with trigger, polling spinner, and report viewer

- **Agent orchestration hub**: `/agents` page now shows multiple agent cards
  - Brand Analyst + Competitor Intel as launchable agents
  - Cards with gradient headers, descriptions, and status badges
  - Ready for future agents (Content Strategist, Market Research)

### Fixed

- **DI error**: `CompanyProfileEntityRepository` not available in `AgentsModule` context — added `TypeOrmModule.forFeature([CompanyProfileEntity])` to resolve NestJS dependency injection for `BrandInterviewWorkerService`

### Changed

- `AGENTS_CATALOG` now supports `AgentCatalogItem[]` with `status` field
- Hub page renders dynamically from catalog entries
- Sidebar "Agentes" → "Brand Analyst" links to hub `/agents`

### Added

- **Agentes IA module**: New `agents/` backend module with tenant-isolated brand interview system
  - `AgentInterviewEntity` + `AgentInterviewMessageEntity` (tenant-scoped, JSONB answers + brand_brief)
  - 4 REST endpoints under `/api/v1/agents/interviews`: list, create, get, submit-answer
  - `TenantGuard` protection on all endpoints — full multi-tenant isolation
  - BullMQ worker (`QUEUE_BRAND_INTERVIEW`) for async Brand Brief generation
  - OpenRouter + Stub adapters (factory pattern — falls back to stub if no LLM provider configured)
  - New LLM task type `brand_interview` (configurable via superadmin Tareas LLM)
  - 6-step conversational interview covering company, industry, audience, brand voice, competitors, objectives
  - Auto-writes Brand Brief fields to Company Profile on completion

- **Hub "🤖 Agentes" in sidebar**: New navigation group under tenant menu with Bot icon
  - `/agents` — Agent hub page showing available agents as cards
  - `/agents/brand-interview` — Landing page with "Iniciar entrevista" CTA
  - `/agents/brand-interview/:id` — Conversational chat UI with real-time polling during processing
  - Scrollable chat with agent/user bubbles, spinner during analysis, Brand Brief JSON preview on completion

### Changed

- `DashboardShell.tsx` — Added "Agentes" navigation group
- `router/index.tsx` — Registered 3 new lazy-loaded routes for agents
- `app.module.ts` — Registered AgentsModule + 2 new TypeORM entities
- `queue.constants.ts` — Added `QUEUE_BRAND_INTERVIEW`
- `llm-task-types.ts` — Added `'brand_interview'` task type