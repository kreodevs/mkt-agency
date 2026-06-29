# Atoms

- **Button** — variantes primarias (`default`, `outline`, `ghost`, …) y de acción (`action`, `action-destructive`, …). Tamaños `default|sm|lg|icon|action`.
- **IconButton** — acciones con ícono + tooltip. Prop `tone`: `default | primary | selected | destructive | success | danger`. Tamaño por defecto `action`.
- **action-button.constants** — `ACTION_BUTTON_GROUP_CLASS`, `ACTION_ICON_CLASS`, mapa tone → variant.
- **InputText**, **Password**, **Textarea**, **Checkbox**, **Avatar**, **StatusPill**

En tablas: agrupar con `ACTION_BUTTON_GROUP_CLASS`; no usar `variant="outline"` ni clases ad-hoc de color.
