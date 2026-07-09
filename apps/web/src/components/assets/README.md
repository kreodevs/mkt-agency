# Componentes — activos

| Componente | Uso |
|------------|-----|
| `AssetUploader.tsx` | Subida multipart con barra de progreso |
| `AssetThumbnail.tsx` | Miniatura por tipo (imagen, video, audio, PDF/documento) |
| `AssetGridCard.tsx` | Tarjeta grid con checkbox, acciones y click → vista previa |
| `AssetBulkSelectionBar.tsx` | Mover / eliminar selección múltiple |
| `AssetLibraryPagination.tsx` | Paginación server-side (20 por página) |
| `AssetPreviewDialog.tsx` | Diálogo pantalla amplia (imagen, video, audio, PDF) |
| `AuthenticatedAssetImage.tsx` | `<img>` autenticado; `variant="thumb"` (default en cards) o `"full"` (editor/vista previa) |
| `AuthenticatedAssetVideo.tsx` | `<video>` con la misma URL autenticada; usado en generaciones MP4 del Image Generator |

Servicio: `src/services/assets.ts` (`getAssetFileUrl`, `resolveAssetPreviewUrl` con `variant: 'thumb' | 'full'`).
