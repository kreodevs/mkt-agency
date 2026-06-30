# Products (frontend)

Páginas y servicios del catálogo de productos/servicios por tenant. Hub principal del pivot producto-first.

## Rutas

- `/products` — listado con progreso de onboarding
- `/products/new` — alta de producto (redirige al onboarding)
- `/products/:id/onboarding` — wizard de onboarding de producto (tags SEO + activación de agentes)
- `/products/:id` — edición

## Onboarding de producto

Wizard de 7 pasos alineado al de empresa (`/onboarding`):

1. Nombre, tipo, descripción, propuesta de valor, audiencia (obligatorios)
2. Precio (opcional)
3. Tags SEO (mín. 3) — scraping de la URL del producto + IA semántica (`POST /products/:id/suggest-keywords` con `{ url }`)

Al completar (`POST /products/:id/onboarding/complete`) se detonan Brand Analyst, descubrimiento de competidores, Competitor Intel y Community Manager con `productId`.

## Componentes compartidos

- `src/components/products/ProductContextBanner.tsx` — banner de contexto en agentes
- `src/components/products/ProductKeywordSuggestion.tsx` — sugerencia IA de tags
- `src/components/products/ProductKeywordTagsInput.tsx` — editor de tags SEO

## API

Ver `src/services/products.ts` (`GET/POST/PATCH /products`, onboarding en `/products/:id/onboarding`).
