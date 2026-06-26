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

Firma: `SHA-256(body|versionId|assetIds ordenados)`.

Eventos en tabla `events` + outbox `ContentApproved` al aprobar.
