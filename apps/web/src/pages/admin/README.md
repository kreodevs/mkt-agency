# admin

Páginas de administración superadmin (plataforma + configuración IA).

## Alcance superadmin

- **Plataforma:** paquetes, usuarios globales, auditoría, seguridad, tenants e impersonación.
- **IA (único contacto con agentes):** proveedores LLM y asignación de modelos por tarea (`/admin/llm-settings`). La operación de agentes (Brand Analyst, Community Manager, Estrategia) es del tenant vía impersonación.

## Páginas

- `PackageListPage.tsx` — CRUD de paquetes/planes con límites (`/admin/packages`)
- `LlmProvidersPage.tsx` — proveedores LLM con URL, API key y selector de modelo con costos (`/admin/llm-providers`)
- `LlmSettingsPage.tsx` — proveedor, modelo principal y **fallback de pago** por tarea (`/admin/llm-settings`); la API reintenta con fallback ante 429
- `LlmUsageDashboardPage.tsx` — consumo global y por tenant con costo estimado (`/admin/llm-usage`)
- `IntegrationsPage.tsx` — integraciones externas; Tavily Search para descubrimiento de competidores (`/admin/integrations`)
- `AdminUsersPage.tsx` — usuarios globales (`/admin/users`)
- `AuditLogsPage.tsx` — consulta de audit logs (`/admin/audit-logs`)
- `SecurityEventsPage.tsx` — eventos de seguridad (`/admin/security-events`)
