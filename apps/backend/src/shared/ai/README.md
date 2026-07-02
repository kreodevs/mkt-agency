# shared/ai

- **LlmClient** — chat JSON por `taskType`; reintenta con `fallbackModel` ante 429/502/503.
- **LlmConfigService** — resuelve proveedor, modelo y fallback por tarea; auto-crea tareas faltantes (p. ej. `video_generation`) con metadatos en español.
- **LlmModelsCatalogService** — catálogo chat (`/models`) + Image API (`/images/models`) + Video API (`/videos/models`) con caché 10 min.
- **llm-fallback.util** — `suggestPaidFallbackModel` (quita `:free`), detección de rate limit.

- **LlmUsageService** — persiste eventos en `llm_usage_events` y expone dashboard agregado (global, por tenant, serie diaria).
- **llm-usage.context** — `AsyncLocalStorage` para propagar `tenantId`/`userId` en workers y servicios.
- **llm-usage-cost.util** — cálculo de costo por tokens; estimación por segundo para video.

Migración `1730000000016-AddLlmTaskFallbackModel.ts`: columna `fallback_model` en `llm_task_configs`.
Migración `1730000000027-CreateLlmUsageEvents.ts`: tabla `llm_usage_events`.
