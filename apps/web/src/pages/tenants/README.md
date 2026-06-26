# Tenants (superadmin)

Página `/tenants` con listado paginado vía `GET /api/v1/tenants`.

## Componentes Kreo

- `DataTable` — tabla con búsqueda global, orden y paginación cliente
- `StatusPill` — badges de plan y estado
- `PageHeader`, `Card`, `Button`

## Filtros servidor

Query params: `status`, `plan` (máx. 100 registros por petición según API).

## Próximo

- Modal/formulario creación tenant (`POST /tenants`)
- Detalle y edición por fila
