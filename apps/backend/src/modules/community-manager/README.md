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

Si el producto tiene ítems en `product_media_kit_items`, `ContentVisualComposerService` prioriza assets reales antes de Image/Video API:

1. **Post estático** — imagen del kit por rol (`product-screenshot` > `event-photo` > …).
2. **Reel / video** — `product-demo` si existe; si no, Ken Burns (FFmpeg) sobre imagen del kit; fallback a generación IA.

El prompt del CM recibe contexto `mediaKit` para evitar copy de stock corporativo cuando hay material humano.

El LLM devuelve `body` (copy publicable) y `visualDescription` (brief de arte) por separado. Al guardar contenido, `visualDescription` se persiste en `contents.visual_prompt`; Image Generator **no** usa el body del post como prompt de imagen.

Preferencias en `tenants.settings.communityManager` (JSONB, sin migración). Tamaños de imagen: `shared/social/image-destination-formats.util.ts` (TikTok vertical 9:16, resto feed 1:1 por defecto).
