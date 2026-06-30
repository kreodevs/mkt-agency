# Product module

Catálogo de productos/servicios por tenant. Es la entidad central del pivot producto-first: las campañas se vinculan a un producto (`scope=product`) o quedan a nivel marca (`scope=brand`, `product_id` null).

## Endpoints

- `GET /api/v1/products` — listado paginado (`?status=active`)
- `POST /api/v1/products` — crear producto
- `POST /api/v1/products/bulk` — crear varios desde nombres (website analyzer)
- `GET /api/v1/products/:id` — detalle
- `PATCH /api/v1/products/:id` — actualizar
- `POST /api/v1/products/:id/archive` — archivar

## Reglas

- Slug único por tenant (auto-generado desde el nombre).
- Un solo `isPrimary` activo por tenant.
- Campañas de producto requieren `productId` activo salvo scope `brand`.
