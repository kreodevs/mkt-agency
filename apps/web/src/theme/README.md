# Theme (Letter)

Tokens CSS en `vars.css`, mapeados en `apps/web/tailwind.config.js`.

## Action buttons

Botones icon-only en tablas y toolbars. Usar `IconButton` + `ACTION_BUTTON_GROUP_CLASS`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--action-size` | 2.25rem | Ancho/alto del botón |
| `--action-icon-size` | 1.125rem | Ícono Lucide |
| `--action-gap` | 4px | Separación entre acciones |
| `--action-bg` | mist-white | Fondo (contraste sobre fila blanca) |
| `--action-border-hover` | deep-teal | Hover con acento Letter |

**Tones (`IconButton`):** `default`, `primary` (teal), `selected`, `destructive`, `success`, `danger`.

Variantes CVA en `Button`: `action`, `action-selected`, `action-destructive`, `action-success`, `action-danger`. Tamaño `action`.
