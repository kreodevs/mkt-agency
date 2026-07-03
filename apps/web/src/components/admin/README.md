# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `ImpersonationTenantDropdown.tsx` — menú en portal (no bloqueado por `overflow-hidden` del layout). Lista con `max-h-panel-md` (no `max-h-64`, que en Letter = 64px).
- `TenantImpersonationSelect.tsx` — trigger en header de consola superadmin.
- `ImpersonationSwitcher.tsx` — trigger mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — autocompletar de modelos OpenRouter (chat + Image API + Video API); lista `position:fixed` dentro del árbol del modal (sin portal a `body`, evita `pointer-events:none` de Radix); selección por clic; búsqueda por nombre/slug y valor manual con Enter. Props `taskType` prioriza modelos de imagen/video.

La lógica de sesión vive en `@/lib/impersonation`.
