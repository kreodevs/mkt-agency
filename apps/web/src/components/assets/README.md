# Componentes — activos

| Componente | Uso |
|------------|-----|
| `AssetUploader.tsx` | Subida multipart con barra de progreso |
| `AuthenticatedAssetImage.tsx` | `<img>` vía `GET /api/v1/assets/:id/file` con JWT en query (MinIO interno) |
| `AuthenticatedAssetVideo.tsx` | `<video>` con la misma URL autenticada; usado en generaciones MP4 del Image Generator |

Servicio: `src/services/assets.ts` (`getAssetFileUrl`, `resolveAssetPreviewUrl`).
