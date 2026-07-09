# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `ImpersonationTenantDropdown.tsx` — menú en portal (no bloqueado por `overflow-hidden` del layout). Lista con `max-h-panel-md` (no `max-h-64`, que en Letter = 64px).
- `TenantImpersonationSelect.tsx` — trigger en header de consola superadmin.
- `ImpersonationSwitcher.tsx` — trigger mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — lista portaleada al `[role="dialog"]` con posición absoluta (visible + clicable dentro del modal Radix); `data-llm-model-listbox`; clic + Enter.

La lógica de sesión vive en `@/lib/impersonation`. Durante impersonación, `GET /tenants` usa el JWT de plataforma guardado en `localStorage` (no el JWT del tenant). Si ese access token expira (15 min), `apiFetchAsPlatform` lo renueva con el refresh token de plataforma antes de reintentar.
