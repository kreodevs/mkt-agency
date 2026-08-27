# Product components

Componentes UI reutilizables del eje producto-first. Tokens Kreo y moléculas `Card`, `EmptyState`, `StatusPill`.

| Componente | Uso |
|---|---|
| `ProductContextBanner` | Muestra en agentes sobre qué producto trabajan |
| `ActiveProductSelector` | Selector global de producto activo (header + localStorage) |
| `ProductPageInference` | Paso 1: scrape + inferencia de perfil comercial completo |
| `ProductKeywordSuggestion` | Paso tags: regenerar keywords desde URL |
| `ProductKeywordTagsInput` | Editor de tags (mín. 3) en wizard de producto |
| `ProductLogoPanel` | Logo del producto: extraer de web, subir manual; se superpone arriba a la izquierda en imágenes IA |
| `ProductBrandVisualKitPanel` | Colores y estilo de marca para plantillas sociales (`GET/PATCH brand-visual-kit`). Vista previa en vivo: degradado, muestras por color y mock de post. |
| `ProductListCard` | Tarjeta SOHO/mobile en listado de productos (`/products`) — acciones esenciales sin n8n/campañas |
| `ProductPublishIntegrationPanel` | Webhook n8n por producto, auto-dispatch y credenciales Meta/LinkedIn (detalle producto, solo Growth) |
| `ProductAppCapturePanel` | Credenciales de app + captura Playwright → kit `product-screenshot` (producto digital y campañas) |
| `ProductMediaKitPanel` | Kit de medios reales (capturas, eventos, demos) — subida directa o **Desde librería** (carpetas PC/iPad/iOS) en `/products/:id/media-kit`. Cada asset: clic en miniatura o **Ver** → `AssetPreviewDialog` a tamaño completo + descarga. |
