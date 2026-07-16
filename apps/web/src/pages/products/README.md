# Products (frontend)

Páginas y servicios del catálogo de productos/servicios por tenant. Hub principal del pivot producto-first.

## Rutas

- `/products` — listado con progreso de onboarding (columna **Audiencia** angosta, multilínea, para dejar visibles tipo/onboarding/acciones)
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

## Onboarding de producto

Wizard de 7 pasos alineado al de empresa (`/onboarding`):

1. Nombre + **URL del producto** (paso 1) — botón **Analizar e inferir campos** (`POST /products/:id/infer-from-page`)
2. Tipo, descripción, propuesta de valor, audiencia (prellenables por IA)
3. Precio (opcional)
4. Tags SEO (mín. 3) — también generables desde la misma URL

Al completar (`POST /products/:id/onboarding/complete`) se detonan Brand Analyst, descubrimiento de competidores (usa tags SEO + perfil del producto + alcance geográfico inferido), Competitor Intel (el backend espera el análisis antes del CM) y Community Manager con `productId`.

## API

Ver `src/services/products.ts` (`GET/POST/PATCH /products`, onboarding en `/products/:id/onboarding`).
