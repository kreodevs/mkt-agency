# competitors

Componentes para monitoreo de competencia.

## Componentes

- `MentionList.tsx` — listado de menciones con filtro de sentimiento
- `CompetitorDiscoveryPanel.tsx` — búsqueda IA por alcance global, país o ciudad; preselecciona producto único y país México; registro bulk de sugerencias

## API relacionada

- `POST /competitors/discover` — encola job async; el frontend hace polling a `GET /competitors/discover/jobs/:jobId`
- `POST /competitors/bulk` — `{ items: [{ name, website?, industry? }] }`
