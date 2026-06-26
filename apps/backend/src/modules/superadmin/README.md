# Superadmin module

Impersonación auditada de tenants (`/api/v1/superadmin/impersonate`).

## Política

`ImpersonationPolicy.assertDestructiveAllowed()` bloquea acciones destructivas durante impersonación.

## Frontend (Kreo UI)

Banner de impersonación: componente custom en `apps/web` apoyado en tokens Kreo cuando se implemente el shell.
