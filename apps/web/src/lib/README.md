# lib

Utilidades compartidas del frontend.

## Formatos de imagen por red (`image-destination-formats.ts`)

Catálogo de destinos del Image Generator alineado a las redes del Community Manager (`instagram`, `facebook`, `linkedin`, `tiktok`, `twitter`). Cada opción mapea a un tamaño API (`1024x1024`, `1024x1792`, `1792x1024`) sin mostrar píxeles al usuario.

## Impersonación (`impersonation.ts`)

Patrón alineado con Kreo Eventos:

- La sesión de **plataforma** (superadmin) se guarda en `localStorage` (`mkt-agency_impersonation`) al entrar a un tenant.
- Impersonación **solo por tenant** (usuario proxy owner/admin en backend).
- Salida o cambio de tenant restaura la sesión de plataforma **sin** llamar al API.
- `getPlatformAccessToken()` — token superadmin para listar tenants o re-impersonar mientras se opera un tenant.
