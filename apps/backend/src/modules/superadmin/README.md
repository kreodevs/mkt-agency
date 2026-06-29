# Superadmin module

Impersonación auditada de tenants (`/api/v1/superadmin/impersonate`).

## Alcance

- **Plataforma:** usuarios globales, proveedores LLM, modelos por tarea (`llm-tasks`), listado de usuarios por tenant.
- **No incluye operación de agentes ni campañas:** esos endpoints usan `TenantGuard` y exigen impersonación si el JWT es superadmin.

## Impersonación

- `POST /superadmin/impersonate` con `{ tenantId }` — el backend elige usuario proxy (owner/admin activo).
- Salida de impersonación: cliente restaura JWT de plataforma guardado (sin DELETE).
- Operativa tenant con JWT impersonado exige `impersonating: true` en el token.

## Política

`ImpersonationPolicy.assertDestructiveAllowed()` bloquea acciones destructivas durante impersonación.

## Frontend

Selector de tenant en header (`TenantImpersonationSelect` / `ImpersonationSwitcher`) — ver `apps/web/src/lib/impersonation.ts`.
