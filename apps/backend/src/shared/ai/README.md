# shared/ai

- **LlmClient** — chat JSON por `taskType`; reintenta con `fallbackModel` ante 429/502/503.
- **LlmConfigService** — resuelve proveedor, modelo y fallback por tarea; auto-crea tareas faltantes (p. ej. `video_generation`) con metadatos en español.
- **LlmModelsCatalogService** — catálogo chat (`/models`) + Image API (`/images/models`) + Video API (`/videos/models`) con caché 10 min.
- **llm-fallback.util** — `suggestPaidFallbackModel` (quita `:free`), detección de rate limit.

Migración `1730000000016-AddLlmTaskFallbackModel.ts`: columna `fallback_model` en `llm_task_configs`.
