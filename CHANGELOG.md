# Changelog

## [0.1.0] — 2026-06-28

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