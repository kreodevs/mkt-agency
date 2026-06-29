# lib

Utilidades compartidas del frontend.

## Impersonación (`impersonation.ts`)

Patrón alineado con Kreo Eventos:

- La sesión de **plataforma** (superadmin) se guarda en `localStorage` (`mkt-agency_impersonation`) al entrar a un tenant.
- Impersonación **solo por tenant** (usuario proxy owner/admin en backend).
- Salida o cambio de tenant restaura la sesión de plataforma **sin** llamar al API.
- `getPlatformAccessToken()` — token superadmin para listar tenants o re-impersonar mientras se opera un tenant.
