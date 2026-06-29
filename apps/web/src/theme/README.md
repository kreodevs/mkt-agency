# Theme (Letter)

Tokens CSS en `vars.css`, mapeados en `apps/web/tailwind.config.js`.

## Action buttons

Botones icon-only en tablas y toolbars. Usar `IconButton` + `ACTION_BUTTON_GROUP_CLASS`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--action-size` | 2rem | Ancho/alto del botón |
| `--action-icon-size` | 1rem | Ícono Lucide |
| `--action-gap` | 4px | Separación entre acciones |
| `--action-bg` | paper-white | Fondo |
| `--action-border` | hairline | Borde plano Letter |
| `--action-fg-hover` | deep-teal | Hover neutro |

**Tones (`IconButton`):** `default`, `selected`, `destructive`, `success`, `danger`.

Variantes CVA en `Button`: `action`, `action-selected`, `action-destructive`, `action-success`, `action-danger`. Tamaño `action`.
