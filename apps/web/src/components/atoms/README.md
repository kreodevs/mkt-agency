# Atoms

- **Button** — variantes primarias (`default`, `outline`, `ghost`, `brand`, …) y de acción (`action`, `action-destructive`, …). Tamaños `default|sm|lg|icon|action`. Estado `disabled`: sin `opacity` global; `brand` quita el gradiente, usa fondo `--brand-muted` y texto `--brand-deep` para contraste legible en cards claras.
- **IconButton** — acciones con ícono + tooltip. Prop `tone`: `default | primary | selected | destructive | success | danger`. Tamaño por defecto `action`.
- **action-button.constants** — `ACTION_BUTTON_GROUP_CLASS`, `ACTION_ICON_CLASS`, mapa tone → variant.
- **InputText**, **Password**, **Textarea**, **Checkbox**, **Avatar**, **StatusPill**
- **Select** — dropdown Kreo con `label`, `hint`, `error`, `placeholder`, `options[]`, `fullWidth`. Usar en filtros (`fullWidth={false}` + `className`) y formularios.

En tablas: agrupar con `ACTION_BUTTON_GROUP_CLASS`; no usar `variant="outline"` ni clases ad-hoc de color. No usar `<select>` nativo fuera del atom `Select`.
