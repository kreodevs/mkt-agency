# Product module

Catálogo de productos/servicios por tenant. Es la entidad central del pivot producto-first: las campañas se vinculan a un producto (`scope=product`) o quedan a nivel marca (`scope=brand`, `product_id` null).

## Endpoints

- `GET /api/v1/products` — listado paginado (`?status=active`)
- `POST /api/v1/products` — crear producto
- `POST /api/v1/products/bulk` — crear varios desde nombres (website analyzer)
- `GET /api/v1/products/:id` — detalle
- `PATCH /api/v1/products/:id` — actualizar
- `POST /api/v1/products/:id/archive` — archivar
- `GET /api/v1/products/:id/onboarding` — estado del onboarding (% campos, missing, ready)
- `POST /api/v1/products/:id/suggest-keywords` — scrapea URL del producto, analiza contenido/concepto con IA y devuelve tags semánticos (no copia meta keywords del HTML)
- `POST /api/v1/products/:id/onboarding/complete` — marcar completado y detonar agentes

## Onboarding de producto

Campos obligatorios: nombre, tipo, descripción, propuesta de valor, audiencia, ≥3 tags SEO.

Al completar (si `ready=true`):

1. **Brand Analyst** — entrevista `brand_interview` con `productId`
2. **Competitors** — `discover` global + `bulkCreate` (hasta 8) usando keywords del producto
3. **Competitor Intel** — `triggerAnalysis`
4. **Community Manager** — `generate` con `productId`

Lógica en `product-onboarding.service.ts`, `product-onboarding.module.ts` y `domain/product-onboarding.util.ts`.

## Reglas

- Slug único por tenant (auto-generado desde el nombre).
- Un solo `isPrimary` activo por tenant.
- Campañas de producto requieren `productId` activo salvo scope `brand`.
