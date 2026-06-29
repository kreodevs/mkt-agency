# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `TenantImpersonationSelect.tsx` — desplegable en header de consola superadmin; elige tenant e impersona al instante.
- `ImpersonationSwitcher.tsx` — desplegable mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — desplegable de modelos LLM con costos por token.

La lógica de sesión vive en `@/lib/impersonation`.
