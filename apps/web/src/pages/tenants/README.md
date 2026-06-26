# Tenants (superadmin)

Listado y alta de tenants. Acción «Impersonar» abre modal con UUID de usuario del tenant (US-003).

Página `/tenants` con listado paginado vía `GET /api/v1/tenants`.

## Componentes Kreo

- `DataTable` — tabla con búsqueda global, orden y paginación cliente
- `StatusPill` — badges de plan y estado
- `PageHeader`, `Card`, `Button`

## Filtros servidor

Query params: `status`, `plan` (máx. 100 registros por petición según API).

## Próximo

- Detalle y edición por fila

## Crear tenant

Modal `CreateTenantModal` (Kreo `Dialog`) — `POST /api/v1/tenants` con owner.
