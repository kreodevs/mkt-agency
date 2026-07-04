# CompetitorsModule

Monitoreo de competencia: registro de competidores y consulta de menciones.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/competitors` | Listar competidores del tenant |
| POST | `/api/v1/competitors` | Registrar competidor |
| POST | `/api/v1/competitors/discover` | Encola búsqueda IA (202 + jobId); worker ejecuta Tavily + LLM; consultar `GET /discover/jobs/:jobId` |

Contexto en `domain/competitor-discovery-context.util.ts` (queries por vertical eventos/memoria/bodas/SaaS, candidatos desde Tavily, filtro estricto con fallback relajado). Tavily: hasta 8 queries, `advanced` en las 2 primeras, síntesis `include_answer` en la primera. Si el LLM devuelve pocos resultados, se complementa con candidatos de Tavily. Tavily se configura en superadmin (`/admin/integrations`).
| POST | `/api/v1/competitors/bulk` | Registrar varios competidores (p. ej. sugerencias IA) |
| DELETE | `/api/v1/competitors/:id` | Eliminar (cascade menciones) |
| GET | `/api/v1/competitors/:id/mentions` | Menciones (filtro `sentiment`, paginación) |

Tras crear o eliminar competidores se sincroniza `company_profiles.competitors` para Competitor Intel.

Task LLM: `competitor_discovery` (auto-creada por `LlmConfigService` si falta).

## Notas MVP

Al registrar un competidor se insertan menciones demo para validar la UI. Un worker externo las reemplazará en producción.

## Migration

`1730000000006-CreateCompetitors.ts`
