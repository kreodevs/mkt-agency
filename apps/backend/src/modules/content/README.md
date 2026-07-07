# Content module

Versionado inmutable de piezas de campaña (US-010 + US-011).

## Rutas (`TenantGuard`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/v1/contents` | Listar / crear |
| GET/PATCH/DELETE | `/api/v1/contents/:id` | Detalle / actualizar (nueva versión) / eliminar |
| GET | `/api/v1/contents/:id/versions` | Historial |
| GET | `/api/v1/contents/:id/versions/:vid` | Versión específica |
| POST | `/api/v1/contents/:id/revert/:vid` | Revertir (nueva versión) |
| POST | `/api/v1/contents/:id/versions/:vid/approve` | Kill Switch SHA-256 |
| POST | `.../reject`, `.../request-changes` | Flujo de aprobación |

Cada `PATCH` crea una versión append-only. Si el contenido estaba `approved`, pasa a `in_changes`.

Campo opcional `platform` (`instagram`, `facebook`, `linkedin`, `twitter`, `tiktok`) al crear desde Community Manager; el Image Generator usa `shared/social/image-destination-formats.util.ts` para el tamaño de imagen.

Campo `visualFormat` (`image`, `video`, `carousel`) indica qué debe generar Image/Video Generator. El agente de Community Manager lo asigna por post; es editable en el editor de contenido sin crear nueva versión.

Campo `visualPrompt` (TEXT, metadata-only): brief de escena para Image/Video Generator. **No** es el copy publicable (`body` de la versión). Community Manager lo rellena desde `visualDescription` del LLM; Image Generator lo usa en lugar del body al generar o regenerar arte.

Campo `platform` (red social destino) también es metadata-only: editable vía `PATCH` sin nueva versión (`scheduledDate`, `visualFormat`, `visualPrompt`, `platform`).

Firma: `SHA-256(body|versionId|assetIds ordenados)`.

Eventos en tabla `events` + outbox `ContentApproved` al aprobar.
