# Superadmin module

Impersonación auditada de tenants (`/api/v1/superadmin/impersonate`).

## Alcance

- **Plataforma:** usuarios globales, proveedores LLM, modelos por tarea (`llm-tasks`), listado de usuarios por tenant.
- **No incluye operación de agentes ni campañas:** esos endpoints usan `TenantGuard` y exigen impersonación si el JWT es superadmin.

## Política

`ImpersonationPolicy.assertDestructiveAllowed()` bloquea acciones destructivas durante impersonación.

## Frontend (Kreo UI)

Banner de impersonación: componente custom en `apps/web` apoyado en tokens Kreo cuando se implemente el shell.
