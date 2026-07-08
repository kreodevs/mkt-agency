# Librería multimedia

Página tenant en `/assets`: carpetas anidadas, listado, filtros, subida y acciones (mover, descargar, duplicar, eliminar).

## Carpetas

- **Árbol lateral:** crear, renombrar y eliminar carpetas (vacías). Soporta subcarpetas (ej. `Capturas / iOS`).
- **Filtros:** Todas, Sin carpeta, o una carpeta concreta.
- **Dispositivos:** nombra carpetas `PC`, `iPad` o `iOS` para que el copiloto CM infiera el tipo de captura.
- **Mover:** selección múltiple → «Mover a…» → carpeta destino.

## UX grid

- **Vista previa:** click en la miniatura abre diálogo amplio (imagen, video con controles, audio, PDF embebido).
- **Multi-selección:** checkbox por tarjeta + «Seleccionar todos» por sección; barra de eliminación masiva (omite activos en uso).
- **Miniaturas:** videos con frame de metadata; audio/documento con icono tipado.

## Integración CM

1. Organiza capturas en carpetas PC / iPad / iOS en la librería.
2. En **Mi producto → Kit de medios**, usa **Desde librería** para enlazar assets al producto.
3. Al generar posts, el CM recibe `folderPath` y `device` en el contexto y prioriza capturas según la red (TikTok/Instagram → móvil).

## Componentes

| Archivo | Rol |
|---------|-----|
| `AssetLibraryPage.tsx` | Página principal |
| `AssetFolderTree.tsx` | Árbol de carpetas |
| `AssetLibraryPickerDialog.tsx` | Selector modal (kit de medios, etc.) |
| `AssetGridCard.tsx`, `AssetUploader.tsx`, … | Grid y subida |

## Acceso

- **Modo copiloto (SOHO):** sidebar **Librería**, tarjeta en bandeja (`PublicationInboxPage`), enlace desde setup CM y desde detalle de producto.
- **Modo agencia:** sidebar Marketing → **Librería**.
