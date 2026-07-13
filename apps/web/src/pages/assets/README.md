# Librería multimedia

Página tenant en `/libreria`: carpetas anidadas, listado, filtros, subida y acciones (mover, descargar, duplicar, eliminar).

## Carpetas

- **Selector:** desplegable con rutas (`Capturas / iOS`) + botón **Organizar** (árbol en diálogo).
- **Filtros:** Todas, Sin carpeta, o una carpeta concreta.
- **Dispositivos:** nombra carpetas `PC`, `iPad` o `iOS` para que el copiloto CM infiera el tipo de captura.
- **Mover:** selección múltiple → «Mover a…» → carpeta destino.

## Layout

- **Barra superior fija al scroll:** selector de carpeta + «Organizar» (árbol en diálogo), filtros y subida.
- **Contenido:** grid o tabla a ancho completo (sin columna lateral permanente).

- **Vista previa:** click en la miniatura abre diálogo amplio (imagen, video con controles, audio, PDF embebido).
- **Vista grid/tabla:** preferencia en `localStorage`; en móvil solo grid. Skeleton al cargar; confirm dialog al borrar carpeta.
- **Multi-selección:** checkbox por tarjeta + «Seleccionar todos» por sección; barra **Mover / Eliminar** en la sección y barra fija inferior al scroll.
- **Miniaturas:** videos con frame de metadata; audio/documento con icono tipado.

## Integración CM

1. Organiza capturas en carpetas PC / iPad / iOS en la librería.
2. En **Mi producto → Kit de medios**, usa **Desde librería** para enlazar assets al producto.
3. Al generar posts, el CM recibe `folderPath` y `device` en el contexto y prioriza capturas según la red (TikTok/Instagram → móvil).

## Componentes

| Archivo | Rol |
|---------|-----|
| `AssetLibraryPage.tsx` | Página principal |
| `AssetFolderTree.tsx` | Árbol de carpetas (diálogo Organizar en librería; lateral en picker) |
| `AssetLibraryPickerDialog.tsx` | Selector modal (kit de medios, etc.) — 20 por página |
| `AssetLibraryPagination.tsx` | Controles Anterior / Siguiente |
| `AssetBulkSelectionBar.tsx` | Mover / eliminar selección (inline en sección + barra fija inferior) |
| `AssetGridCard.tsx`, `AssetUploader.tsx`, … | Grid y subida |

## Acceso

- **Modo copiloto (SOHO):** sidebar **Librería**, tarjeta en bandeja (`PublicationInboxPage`), enlace desde setup CM y desde detalle de producto.
- **Modo agencia:** sidebar Marketing → **Librería**.
