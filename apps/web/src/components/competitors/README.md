# competitors

Componentes para monitoreo de competencia.

## Componentes

- `MentionList.tsx` — listado de menciones con filtro de sentimiento
- `CompetitorDiscoveryPanel.tsx` — búsqueda IA por alcance global, país o ciudad; registro bulk de sugerencias

## API relacionada

- `POST /competitors/discover` — `{ scope, country?, city? }`
- `POST /competitors/bulk` — `{ items: [{ name, website?, industry? }] }`
