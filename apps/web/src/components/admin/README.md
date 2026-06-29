# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `ImpersonationTenantDropdown.tsx` — menú en portal (no bloqueado por `overflow-hidden` del layout).
- `TenantImpersonationSelect.tsx` — trigger en header de consola superadmin.
- `ImpersonationSwitcher.tsx` — trigger mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — desplegable de modelos LLM con costos por token.

La lógica de sesión vive en `@/lib/impersonation`.
