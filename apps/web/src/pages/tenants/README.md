# Tenants (superadmin)

Listado y alta de tenants. Impersonación directa por tenant (estilo Kreo Eventos): un clic en «Impersonar» o selector en el header.

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

Modal `CreateTenantModal` (Kreo `Dialog`) — `POST /api/v1/tenants` con owner, paquete (`packageId`) y validación de contraseña/slug en cliente. Los errores de API se muestran en toast y en un banner dentro del modal.
