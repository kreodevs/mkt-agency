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

## Kit de medios y composición visual

Si el producto tiene ítems en `product_media_kit_items`, `ContentVisualComposerService` prioriza fotos reales del kit antes de la API de imágenes.

1. **Post estático / carrusel** — imágenes del kit por rol (`product-screenshot` > `event-photo` > …).
2. **Video IA** — deshabilitado. Futuro: reel con FFmpeg y material del kit.

## CM virtual (talking-head)

Actividad inicial idempotente en el copiloto:

1. **Retrato** — tarea `cm_portrait_generation` (OpenRouter Flux 9:16).
2. **Vista previa** — TTS (`tts_generation`, ElevenLabs) + lip-sync (`talking_head_generation`, Replicate `prunaai/p-video-avatar`).
3. Posts TikTok con `visualFormat: talking-head` cuando `cmCharacter.readyAt` está definido.

API: `GET/PATCH /api/v1/products/:id/cm-character`, `POST .../generate-portrait`, `POST .../generate-preview`.

Metadata en `product.metadata.cmCharacter`.

Preferencias en `tenants.settings.communityManager` (JSONB, sin migración). Tamaños de imagen: `shared/social/image-destination-formats.util.ts` (TikTok vertical 9:16, resto feed 1:1 por defecto).
