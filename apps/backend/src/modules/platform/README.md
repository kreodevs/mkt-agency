# platform

Entidades de configuración de plataforma (superadmin).

## LLM

- **`llm_providers`** — proveedores OpenAI-compatible (URL + API key + modelo por defecto).
- **`llm_task_configs`** — tarea → proveedor + modelo + temperatura.

Configuración vía UI:

- `/admin/llm-providers` — CRUD proveedores
- `/admin/llm-settings` — asignación por tarea

Ya **no** se usan `AI_API_URL`, `AI_API_KEY` ni `AI_MODEL` en variables de entorno.

## Integraciones externas

- **`platform_integrations`** — API keys de servicios externos (slug + key + activo).
- Tavily (`slug: tavily`) — búsqueda web para descubrimiento de competidores.

Configuración vía UI: `/admin/integrations`
