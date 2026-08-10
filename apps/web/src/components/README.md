# Componentes UI (Kreo)

## Paleta de marca (2026)

- **Brand accent:** `--brand` / `--color-brand` (terracota `#c2410c`) — CTAs, progreso, acentos
- **Neutros:** ivory & slate (Anthropic-inspired)
- Utilidades: `.page-hero`, `.brand-gradient-text`, `.kreo-surface-elevated`, `.page-stack`, `.filter-row`

- **atoms:** Button, IconButton, InputText, Password, Avatar, StatusPill, Checkbox, Textarea, **Select**
- **molecules:** Card (variants: default, elevated, accent, glass), PageHeader, StatsCard, EmptyState, Stepper, Progress, Sonner, …
- **organisms:** AppLayout, SidebarModern (cabecera lateral y header principal con altura fija `h-header`; versión de deploy en tooltip del brand), DataTable, KanbanBoard

**Alturas de controles:** la escala `spacing` Letter redefine valores numéricos (`h-8` → 8px, `max-h-64` → 64px). Usar tokens `h-control-*`, `max-h-panel-*` y `--action-*` (ver `theme/README.md`).

**Acciones en tablas:** `IconButton` con `tone` + `ACTION_BUTTON_GROUP_CLASS`; no estilos ad-hoc.

Fuente: MCP Kreo workflow DEV (`pull_source_code_from_registry`).
