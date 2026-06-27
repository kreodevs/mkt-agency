# platform

Entidades de configuración de plataforma (superadmin).

## LLM

- **`llm_providers`** — proveedores OpenAI-compatible (URL + API key + modelo por defecto).
- **`llm_task_configs`** — tarea → proveedor + modelo + temperatura.

Configuración vía UI:

- `/admin/llm-providers` — CRUD proveedores
- `/admin/llm-settings` — asignación por tarea

Ya **no** se usan `AI_API_URL`, `AI_API_KEY` ni `AI_MODEL` en variables de entorno.
