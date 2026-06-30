# shared/ai

- **LlmClient** — chat JSON por `taskType`; reintenta con `fallbackModel` ante 429/502/503.
- **LlmConfigService** — resuelve proveedor, modelo y fallback por tarea.
- **llm-fallback.util** — `suggestPaidFallbackModel` (quita `:free`), detección de rate limit.

Migración `1730000000016-AddLlmTaskFallbackModel.ts`: columna `fallback_model` en `llm_task_configs`.
