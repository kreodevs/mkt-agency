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
2. **Capturas del media kit** — `resizeScreenshotForSlot` usa `contain` (no `cover`) para capturas portrait/móvil; mockups de dispositivo muestran la pantalla completa con letterbox.
2. **Layouts** — cada plantilla usa una composición distinta (no overlay semitransparente sobre toda la captura):
   - `product-hero` / carrusel slide 2 → **split**: captura arriba (~52 %), texto en panel sólido abajo
   - `tip-card` / `promo-cta` → **mockup**: captura en marco de dispositivo (iPhone o MacBook) sobre gradiente
   - `quote-insight` → **editorial**: texto dominante + miniatura de app en esquina
   - `stat-highlight` → **stat**: cifra grande + thumbnail pequeño
   - `story-vertical` → **bleed**: captura superior + panel inferior opaco (proporciones 9:16 vs 1:1)
   - Carrusel slide 1 → hook solo con gradiente; slide 3 → CTA en fondo sólido de marca
3. **Dispositivo y plataforma** — `device-frame-render.util.ts` elige marco según red y formato:
   - LinkedIn / X → MacBook; Instagram / TikTok / Facebook → iPhone
   - TikTok (9:16) ajusta proporciones de split/bleed y prioriza mockup en carrusel
3. **LLM** — elige `visualTemplateId` + `visualHeadline` / `visualSubline` / `visualCta` por post
4. **Marca** — colores desde `visual_preferences` del perfil o `product.metadata.brandVisualKit`
5. **Fotos reales** — prioriza assets del media kit; sin captura → gradiente de marca
6. **Regenerar** — reutiliza la misma plantilla con variación de foto (`pipeline: visual-template` en generación)

Orden en `attachVisualForPost`: talking-head → plantilla (capturas `product-screenshot` del media kit) → IA enriquecida (paleta + intel competitiva). Si el reel con CM virtual falla, se reintenta automáticamente con plantilla y las capturas del kit.

API kit de marca: `GET/PATCH /api/v1/products/:id/brand-visual-kit` (UI en detalle de producto)

Recomponer plantilla desde editor: `POST /api/v1/community-manager/contents/:contentId/recompose-visual`

1. **Biblioteca** — varias CMs en `product.metadata.cmCharacters` (migración automática desde `cmCharacter` legacy).
2. **Retrato** — IA o biblioteca. Cambiar retrato resetea `readyAt` y exige nueva vista previa.
3. **Vista previa** — TTS + lip-sync para marcar la CM como `ready` (`readyCount`).
4. Posts TikTok `talking-head` incluyen `cmCharacterId` elegido por el LLM.
5. El `body` del guion se limpia de marcadores de tiempo `(0:00-0:05)` antes de TTS y en la UI (`sanitizePublishableCopy` / `sanitizeSpanishNarrationScript`).
6. Cada CM guarda `voiceId` / `voiceName` de ElevenLabs; lip-sync usa Replicate (`p-video-avatar`). La biblioteca expone `GET /products/:id/cm-characters/voices` para el selector en UI.

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
