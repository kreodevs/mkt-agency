# Tenant module — Mkt Agency OS

CRUD de tenants (superadmin). Endpoints bajo `/api/v1/tenants`.

## Autenticación

Requiere `Authorization: Bearer <JWT>` con claim `isSuperadmin: true`.

Guards: `JwtAuthGuard` + `SuperadminGuard` (`apps/backend/src/shared/guards/`).

> El login (`POST /auth/login`) se implementa en US-004; hasta entonces los tokens deben emitirse con el mismo payload (`sub`, `email`, `isSuperadmin`, `role`, `tenantId`).

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/tenants` | Crea tenant + owner (transacción) + perfil onboarding |

Errores frecuentes en prod legacy: migración `1730000000012` añade `max_users`, `max_assets_size`, `package_id` en `tenants` si faltaban (antes → 500 opaco).
| GET | `/tenants` | Lista paginada (`page`, `limit`, `status`, `plan`) |
| GET | `/tenants/:id` | Detalle |
| PATCH | `/tenants/:id` | Actualiza plan, status, settings, límites |
| DELETE | `/tenants/:id` | Elimina tenant (cascade users) |

## Frontend (Kreo UI)

Para la vista de listado usar **`DataTable`** del MCP Kreo (`GET /api/v1/tenants` como `dataSource`). Ver MDD §8 mapeo `tenants → DataTable`.
