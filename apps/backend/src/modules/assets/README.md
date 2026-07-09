# Assets (US-015)

Librería multimedia por tenant con almacenamiento S3-compatible (MinIO en local).

## Endpoints

| Método | Ruta |
|--------|------|
| GET/POST upload/PATCH/DELETE | `/api/v1/assets` |
| GET | `/api/v1/assets/:id/file` (original) |
| GET | `/api/v1/assets/:id/thumbnail` (WebP ≤480px para cards) |
| GET | `/api/v1/asset-folders` |
| GET/POST | `/api/v1/asset-tags` |

Storage: `S3StorageAdapter` si hay `S3_ACCESS_KEY`, `S3_SECRET_KEY` y `S3_BUCKET`; si no, `LocalStorageAdapter` (`uploads/`).

Los visuales del copiloto (semana CM) se suben vía Image Generator con `metadata.source = copilot-week`, `contentId`, `productId` y `generationId` para localizarlos en la librería.

## Carpetas y CM

- `asset_folders` soporta árbol anidado (`parent_id`).
- Nombres como `PC`, `iPad`, `iOS` se infieren como `device` en el prompt del Community Manager.
- `AssetFolderService.buildLibrarySummaryForLlm` expone conteos por carpeta al generar copy.
- Los ítems del kit de medios incluyen `folderPath` y `device` cuando el asset está en una carpeta.

Las URLs públicas de assets devuelven `/api/v1/assets/:id/file` (stream autenticado). MinIO/S3 solo se usa en red interna; el navegador no debe recibir `http://minio:9000/...`.

En cada subida de **imagen**, el backend genera un thumbnail WebP (máx. 480px) en el mismo prefijo S3 (`thumb.webp`) y lo expone en `/api/v1/assets/:id/thumbnail`. La publicación y descargas usan el archivo original.

Imágenes legacy sin thumbnail en metadata se regeneran **lazy** en la primera petición a `/thumbnail` (Sharp → S3 → metadata) y las siguientes sirven el WebP almacenado.

Al arrancar, `S3StorageAdapter` crea el bucket si no existe (MinIO). En Dokploy el servicio `minio-init` también ejecuta `mc mb` con `S3_BUCKET` (default `mkt-agency-assets`).

Variable opcional: `STORAGE_LOCAL_PUBLIC_BASE` (default `http://localhost:3000/uploads`).
