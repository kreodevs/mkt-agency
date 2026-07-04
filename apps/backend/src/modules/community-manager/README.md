# CommunityManagerModule

Generación de copy para redes sociales con IA.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/community-manager/batches` | Historial de batches |
| GET | `/api/v1/community-manager/preferences` | Plataformas y count guardados por tenant |
| PUT | `/api/v1/community-manager/preferences` | Persistir selección de plataformas |
| GET | `/api/v1/community-manager/readiness` | Prerrequisitos (producto + marca) |
| POST | `/api/v1/community-manager/generate` | Generar copy (`productId` opcional); guarda `platform` en cada contenido e imágenes con formato por red |

El prompt del LLM incluye el **último análisis completado** de Competitor Intel (`agent_competitor_analyses`) y los nombres registrados en `competitors`, para diferenciar el copy y explotar `marketGaps` / `recommendation`. Si no hay análisis, usa solo la lista de competidores si existe.

Preferencias en `tenants.settings.communityManager` (JSONB, sin migración). Tamaños de imagen: `shared/social/image-destination-formats.util.ts` (TikTok vertical 9:16, resto feed 1:1 por defecto).
