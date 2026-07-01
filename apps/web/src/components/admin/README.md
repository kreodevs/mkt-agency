# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `ImpersonationTenantDropdown.tsx` — menú en portal (no bloqueado por `overflow-hidden` del layout). Lista con `max-h-panel-md` (no `max-h-64`, que en Letter = 64px).
- `TenantImpersonationSelect.tsx` — trigger en header de consola superadmin.
- `ImpersonationSwitcher.tsx` — trigger mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — autocompletar de modelos OpenRouter (chat + Image API); búsqueda por nombre/slug y valor manual con Enter. Props `taskType` prioriza modelos de imagen en `image_generation`.

La lógica de sesión vive en `@/lib/impersonation`.
