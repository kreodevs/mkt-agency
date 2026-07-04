# Product module

Catálogo de productos/servicios por tenant. Es la entidad central del pivot producto-first: las campañas se vinculan a un producto (`scope=product`) o quedan a nivel marca (`scope=brand`, `product_id` null).

## Endpoints

- `GET /api/v1/products` — listado paginado (`?status=active`)
- `POST /api/v1/products` — crear producto
- `POST /api/v1/products/bulk` — crear varios desde nombres (website analyzer)
- `GET /api/v1/products/:id` — detalle
- `PATCH /api/v1/products/:id` — actualizar
- `POST /api/v1/products/:id/archive` — archivar
- `POST /api/v1/products/:id/logo/from-website` — extrae logo desde la URL del producto (scrape)
- `POST /api/v1/products/:id/logo` — sube logo manual (multipart `file`)
- `DELETE /api/v1/products/:id/logo` — quita logo del producto
- `GET /api/v1/products/:id/onboarding` — estado del onboarding (% campos, missing, ready)
- `POST /api/v1/products/:id/infer-from-page` — scrapea URL e infiere nombre, tipo, descripción, propuesta de valor, audiencia, precio y tags
- `POST /api/v1/products/:id/suggest-keywords` — scrapea URL del producto, analiza contenido/concepto con IA y devuelve tags semánticos (no copia meta keywords del HTML)
- `POST /api/v1/products/:id/onboarding/complete` — marca completado y activa agentes **en segundo plano** (respuesta inmediata; notificación en bandeja al terminar)

## Onboarding de producto

Campos obligatorios: nombre, tipo, descripción, propuesta de valor, audiencia, ≥3 tags SEO.

Al completar (si `ready=true`), en background:

1. **Brand Analyst** — entrevista `brand_interview` con `productId`
2. **Competitors** — `discover` global + `bulkCreate` (hasta 8) usando keywords del producto (omite si falta perfil de empresa)
3. **Competitor Intel** — `triggerAnalysis` y **espera** hasta `completed`/`failed` (máx. 3 min)
4. **Community Manager** — `generate` con `productId` usando el análisis ya cableado (sin imágenes en onboarding)

Lógica en `product-onboarding.service.ts`, `product-onboarding.module.ts` y `domain/product-onboarding.util.ts`.

## Reglas

- Slug único por tenant (auto-generado desde el nombre).
- Un solo `isPrimary` activo por tenant.
- Campañas de producto requieren `productId` activo salvo scope `brand`.
