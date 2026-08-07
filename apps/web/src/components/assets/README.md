# Componentes — activos

| Componente | Uso |
|------------|-----|
| `AssetUploader.tsx` | Subida multipart con barra de progreso |
| `AssetThumbnail.tsx` | Miniatura por tipo (imagen, video, audio, PDF/documento) |
| `AssetGridCard.tsx` | Tarjeta grid con checkbox, acciones y click → vista previa |
| `AssetBulkSelectionBar.tsx` | Mover / eliminar selección múltiple |
| `AssetLibraryPagination.tsx` | Paginación server-side (20 por página) |
| `AssetPreviewDialog.tsx` | Diálogo pantalla amplia (imagen, video, audio, PDF) |
| `AuthenticatedAssetImage.tsx` | `<img>` vía `fetch` + Bearer (sin JWT en URL); fallback «No disponible» |
| `AuthenticatedAssetVideo.tsx` | `<video>` con el mismo patrón autenticado |

Servicio: `src/services/assets.ts` (`getAssetFileUrl`, `resolveAssetPreviewUrl` con `variant: 'thumb' | 'full'`).
