# shared/ai

- **LlmClient** — chat JSON por `taskType`; reintenta con `fallbackModel` ante 429/502/503.
- **LlmConfigService** — resuelve proveedor, modelo y fallback por tarea; auto-crea tareas faltantes (p. ej. `video_generation`) con metadatos en español.
- **LlmModelsCatalogService** — catálogo chat (`/models`) + Image API (`/images/models`) + Video API (`/videos/models`) con caché 10 min.
- **llm-fallback.util** — `suggestPaidFallbackModel` (quita `:free`), detección de rate limit.

- **LlmProviderBootstrapService** — al arrancar, copia `OPENROUTER_API_KEY`, `REPLICATE_API_KEY` y `ELEVENLABS_API_KEY` del entorno a filas `llm_providers` si `api_key` está vacío (evita stubs hasta configurar Superadmin manualmente).
- **LlmCircuitBreakerService** — 5 fallos 429/5xx por proveedor → circuit open 60s; half-open con un probe. Integrado en `LlmClient`.
- **llm-usage.context** — `AsyncLocalStorage` para propagar `tenantId`/`userId` en workers y servicios.
- **llm-usage-cost.util** — cálculo de costo por tokens; estimación por segundo para video.

Migración `1730000000016-AddLlmTaskFallbackModel.ts`: columna `fallback_model` en `llm_task_configs`.
Migración `1730000000027-CreateLlmUsageEvents.ts`: tabla `llm_usage_events`.
