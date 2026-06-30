# Bandeja de publicación (frontend)

Página principal del tenant en `/`. Flujo agencia autónoma:

1. Agentes generan copy → calendario (borrador)
2. Usuario aprueba en bandeja (individual o lote)
3. Copiar y Llevar inline para publicar manualmente en redes

## Archivos

| Archivo | Rol |
|---------|-----|
| `pages/publication-inbox/PublicationInboxPage.tsx` | Vista hub |
| `components/publication-inbox/InboxItemCard.tsx` | Fila con aprobación inline |
| `components/publication-inbox/InboxKitPanel.tsx` | Kit Copiar y Llevar multi-día |
| `services/publication-inbox.ts` | Cliente API |
| `store/active-product.ts` | Producto activo (localStorage) |
| `components/products/ActiveProductSelector.tsx` | Selector en header |

Resumen KPIs legacy: `/agency-overview`.
