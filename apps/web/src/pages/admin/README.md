# admin

Páginas de administración superadmin (plataforma + configuración IA).

## Alcance superadmin

- **Plataforma:** paquetes, usuarios globales, auditoría, seguridad, tenants e impersonación.
- **IA (único contacto con agentes):** proveedores LLM y asignación de modelos por tarea (`/admin/llm-settings`). La operación de agentes (Brand Analyst, Community Manager, Estrategia) es del tenant vía impersonación.

## Páginas

- `PackageListPage.tsx` — CRUD de paquetes/planes con límites (`/admin/packages`)
- `LlmProvidersPage.tsx` — proveedores LLM con URL, API key y selector de modelo con costos (`/admin/llm-providers`)
- `LlmSettingsPage.tsx` — proveedor y modelo por tarea de IA (`/admin/llm-settings`)
- `AdminUsersPage.tsx` — usuarios globales (`/admin/users`)
- `AuditLogsPage.tsx` — consulta de audit logs (`/admin/audit-logs`)
- `SecurityEventsPage.tsx` — eventos de seguridad (`/admin/security-events`)
