# Products (frontend)

Páginas y servicios del catálogo de productos/servicios por tenant. Hub principal del pivot producto-first.

## Rutas

- `/products` — listado; **Integración n8n** = configuración; **Publicar** = en cada arte de la bandeja
- `/products/new` — alta de producto (redirige al onboarding)
- `/products/:id/onboarding` — wizard de onboarding de producto (tags SEO + activación de agentes)
- `/products/:id` — edición
- `/products/:id/media-kit` — kit de medios (capturas, demos, eventos) con drag & drop; UI con `Card`, `EmptyState`, `StatusPill`

## Componentes compartidos

- `src/components/products/ProductContextBanner.tsx` — banner de contexto en agentes
- `src/components/products/ProductKeywordSuggestion.tsx` — sugerencia IA de tags
- `src/components/products/ProductKeywordTagsInput.tsx` — editor de tags SEO
- `src/components/products/ProductMediaKitPanel.tsx` — panel drag & drop del kit
- `src/components/products/ProductLogoPanel.tsx` — logo con tokens `--warning` para avisos
- `src/components/products/ProductPublishIntegrationPanel.tsx` — webhook n8n por producto (detalle `/products/:id`)

## Publicación n8n

**Configuración** en producto (`Integración n8n`). **Publicar** en cada arte aprobado de la bandeja/copiloto (barra bajo el mockup visual).

Workflow de ejemplo importable: [`docs/integrations/n8n/`](../../../docs/integrations/n8n/README.md).

## Onboarding de producto

1. Nombre + **URL del producto** (paso 1) — botón **Analizar e inferir campos** (`POST /products/:id/infer-from-page`)
2. Tipo, descripción, propuesta de valor, audiencia (prellenables por IA)
3. Precio (opcional)
4. Tags SEO (mín. 3) — también generables desde la misma URL

Al completar (`POST /products/:id/onboarding/complete`) se detonan Brand Analyst, descubrimiento de competidores (usa tags SEO + perfil del producto + alcance geográfico inferido), Competitor Intel (el backend espera el análisis antes del CM) y Community Manager con `productId`.

## API

Ver `src/services/products.ts` (`GET/POST/PATCH /products`, onboarding en `/products/:id/onboarding`).
