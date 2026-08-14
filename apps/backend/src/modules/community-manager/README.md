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

## Visual Studio (plantillas)

`VisualTemplateComposerService` maqueta piezas con Sharp + SVG antes del fallback IA:

1. **Plantillas** — `product-hero`, `tip-card`, `quote-insight`, `promo-cta`, `stat-highlight`, `story-vertical`
2. **LLM** — elige `visualTemplateId` + `visualHeadline` / `visualSubline` / `visualCta` por post
3. **Marca** — colores desde `visual_preferences` del perfil o `product.metadata.brandVisualKit`
4. **Fotos reales** — prioriza assets del media kit como fondo/hero
5. **Regenerar** — reutiliza la misma plantilla con variación de foto (`pipeline: visual-template` en generación)

Orden en `attachVisualForPost`: talking-head → plantilla → IA enriquecida (paleta + intel competitiva).

API kit de marca: `GET/PATCH /api/v1/products/:id/brand-visual-kit`

1. **Biblioteca** — varias CMs en `product.metadata.cmCharacters` (migración automática desde `cmCharacter` legacy).
2. **Retrato** — IA o biblioteca. Cambiar retrato resetea `readyAt` y exige nueva vista previa.
3. **Vista previa** — TTS + lip-sync para marcar la CM como `ready` (`readyCount`).
4. Posts TikTok `talking-head` incluyen `cmCharacterId` elegido por el LLM.

Replicate y otros proveedores externos no pueden resolver hostnames internos de Docker (`minio:9000`). El pipeline de lip-sync usa URLs públicas de la API (`API_PUBLIC_URL`) con JWT de corta duración (`GET /assets/:id/file?access_token=...`) en lugar de presigned MinIO. En producción, `API_PUBLIC_URL` debe ser alcanzable desde internet; en local puede requerir túnel (ngrok, etc.) para probar lip-sync.

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
