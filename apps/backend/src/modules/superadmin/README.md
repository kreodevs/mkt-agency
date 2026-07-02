# Superadmin module

Impersonación auditada de tenants (`/api/v1/superadmin/impersonate`).

## Alcance

- **Plataforma:** usuarios globales, proveedores LLM, modelos por tarea (`llm-tasks`), integraciones externas (Tavily), listado de usuarios por tenant.
- **No incluye operación de agentes ni campañas:** esos endpoints usan `TenantGuard` y exigen impersonación si el JWT es superadmin.

## Impersonación

- `POST /superadmin/impersonate` con `{ tenantId }` — el backend elige usuario proxy (owner/admin activo).
- Salida de impersonación: cliente restaura JWT de plataforma guardado (sin DELETE).
- Operativa tenant con JWT impersonado exige `impersonating: true` en el token.

## Política

`ImpersonationPolicy.assertDestructiveAllowed()` bloquea acciones destructivas durante impersonación.

## Integraciones

- `GET /superadmin/integrations/tavily` — estado de Tavily (key enmascarada)
- `PATCH /superadmin/integrations/tavily` — actualizar API key y activo
- `POST /superadmin/integrations/tavily/test` — prueba de conexión

## Frontend

Selector de tenant en header (`TenantImpersonationSelect` / `ImpersonationSwitcher`) — ver `apps/web/src/lib/impersonation.ts`.
