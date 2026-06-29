# Componentes UI (Kreo)

Import path oficial: `@/components/{layer}/{Name}`.

- **atoms:** Button, IconButton, InputText, Password, Avatar, StatusPill, Checkbox, Textarea
- **molecules:** Card, PageHeader, Sonner, Tooltip, Stepper, Progress
- **organisms:** AppLayout, SidebarModern (muestra `v{commit}` bajo el logo), DataTable, KanbanBoard

**Alturas de controles:** la escala `spacing` Letter redefine valores numéricos (`h-8` → 8px, `max-h-64` → 64px). Usar tokens `h-control-*`, `max-h-panel-*` y `--action-*` (ver `theme/README.md`).

**Acciones en tablas:** `IconButton` con `tone` + `ACTION_BUTTON_GROUP_CLASS`; no estilos ad-hoc.

Fuente: MCP Kreo workflow DEV (`pull_source_code_from_registry`).
