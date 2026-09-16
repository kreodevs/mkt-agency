# admin

Componentes de administración superadmin.

## Impersonación (estilo Kreo Eventos)

- `ImpersonationTenantDropdown.tsx` — menú en portal (no bloqueado por `overflow-hidden` del layout). Lista con `max-h-panel-md` (no `max-h-64`, que en Letter = 64px).
- `TenantImpersonationSelect.tsx` — trigger en header de consola superadmin.
- `ImpersonationSwitcher.tsx` — trigger mientras impersonas; cambia de tenant o vuelve a «Consola superadmin».
- `LlmModelSelect.tsx` — lista portaleada al `[role="dialog"]` con posición absoluta (visible + clicable dentro del modal Radix); `data-llm-model-listbox`; clic + Enter.

La lógica de sesión vive en `@/lib/impersonation`. Durante impersonación, `GET /tenants` usa el JWT impersonado (válido ~1 h) con `superadminId`; el backend acepta esa sesión auditada solo para listar tenants. Cambiar de tenant (`POST /superadmin/impersonate`) sigue usando `apiFetchAsPlatform` con el token de plataforma en `localStorage`.

## Tarjetas mobile (superadmin)

En pantallas &lt; md, las tablas de admin usan cards en lugar de scroll horizontal:

| Componente | Página |
|------------|--------|
| `AdminUserCard` | `/admin/users` |
| `AuditLogCard` | `/admin/audit-logs` |
| `SecurityEventCard` | `/admin/security-events` |
| `PackageListCard` | `/admin/packages` |

Las tarjetas de lista usan `listCardClassName()` de `@/lib/list-card` (hover border, sombra y lift).
