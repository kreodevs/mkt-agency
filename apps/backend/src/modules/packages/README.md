# packages

Catálogo de **paquetes/planes** configurables por superadmin.

## API (superadmin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/packages` | Listar paquetes (`?includeInactive=true`) |
| POST | `/api/v1/packages` | Crear paquete |
| PATCH | `/api/v1/packages/:id` | Actualizar límites |
| DELETE | `/api/v1/packages/:id` | Eliminar paquete |

## Límites por paquete

- `maxUsers`, `maxAssetsSize`, `maxFileSize`
- `maxCampaigns`, `maxAiRequestsPerDay` (opcionales)
- `features` (JSONB para flags futuros)

Al crear un tenant con `packageId`, se copian los límites al registro `tenants`.

## Tenant app

- `GET /api/v1/tenant/limits` — snapshot de límites + uso actual (usuarios, storage, campañas).
- `TenantLimitsService` valida uploads en `AssetService`.
