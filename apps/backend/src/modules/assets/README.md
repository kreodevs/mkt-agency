# Assets (US-015)

Librería multimedia por tenant con almacenamiento S3-compatible (MinIO en local).

## Endpoints

| Método | Ruta |
|--------|------|
| GET/POST upload/PATCH/DELETE | `/api/v1/assets` |
| GET | `/api/v1/asset-folders` |
| GET/POST | `/api/v1/asset-tags` |

Storage: `S3StorageAdapter` si hay `S3_ACCESS_KEY`, `S3_SECRET_KEY` y `S3_BUCKET`; si no, `LocalStorageAdapter` (`uploads/`).

Variable opcional: `STORAGE_LOCAL_PUBLIC_BASE` (default `http://localhost:3000/uploads`).
