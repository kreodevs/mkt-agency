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

Biblioteca de presentadoras virtuales por producto. El copiloto elige la CM más adecuada por post TikTok.

1. **Biblioteca** — varias CMs en `product.metadata.cmCharacters` (migración automática desde `cmCharacter` legacy).
2. **Retrato** — IA (`cm_portrait_generation`) o selección desde biblioteca de assets.
3. **Vista previa** — TTS + lip-sync para marcar la CM como `ready`.
4. Posts TikTok `talking-head` incluyen `cmCharacterId` elegido por el LLM.

### API biblioteca

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products/:id/cm-characters` | Lista biblioteca + `readyCount` |
| POST | `/api/v1/products/:id/cm-characters` | Crear CM `{ name }` |
| PATCH | `/api/v1/products/:id/cm-characters/default` | Fijar CM por defecto |
| GET/PATCH/DELETE | `/api/v1/products/:id/cm-characters/:characterId` | Detalle, apariencia, eliminar |
| POST | `.../:characterId/generate-portrait` | Retrato IA |
| POST | `.../:characterId/select-portrait` | Retrato desde asset `{ assetId }` |
| POST | `.../:characterId/generate-preview` | Vista previa lip-sync |

### API legacy (CM por defecto)

`GET/PATCH /api/v1/products/:id/cm-character`, `POST .../generate-portrait`, `POST .../generate-preview`.

Metadata: `product.metadata.cmCharacters` (biblioteca) + `cmCharacter` (espejo de la CM por defecto).

Preferencias en `tenants.settings.communityManager` (JSONB, sin migración). Tamaños de imagen: `shared/social/image-destination-formats.util.ts` (TikTok vertical 9:16, resto feed 1:1 por defecto).
