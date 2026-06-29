# Tenants (superadmin)

Listado, alta y edición de tenants. Impersonación directa por tenant (estilo Kreo Eventos): botón «Impersonar» o selector en el header.

Página `/tenants` con listado paginado vía `GET /api/v1/tenants`.

## Componentes Kreo

- `DataTable` — tabla con búsqueda global, orden y paginación cliente
- `StatusPill` — badges de plan y estado
- `PageHeader`, `Card`, `Button`, `Dialog`

## Filtros servidor

Query params: `status`, `plan` (máx. 100 registros por petición según API).

## Crear tenant

Modal `CreateTenantModal` — `POST /api/v1/tenants` con owner, paquete (`packageId`) y validación de contraseña/slug en cliente.

## Editar tenant

Modal `EditTenantModal` — `PATCH /api/v1/tenants/:id` con nombre, plan, estado, paquete, límites y checkbox **Asignarme como administrador de plataforma**.

Esa asignación (`platformAdminIds`) permite impersonar el tenant aunque no tenga owner/admin activo. El login del superadmin sigue abriendo la consola de plataforma (`tenantId` null en JWT), no la vista tenant.
