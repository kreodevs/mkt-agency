# Componentes — activos

| Componente | Uso |
|------------|-----|
| `AssetUploader.tsx` | Subida multipart con barra de progreso |
| `AuthenticatedAssetImage.tsx` | `<img>` vía `GET /api/v1/assets/:id/file` con JWT en query (MinIO interno) |

Servicio: `src/services/assets.ts` (`getAssetFileUrl`, `resolveAssetPreviewUrl`).
