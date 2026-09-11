# Componentes UI (Kreo v5.5)

## Paleta de marca (2026)

- **Brand accent:** `--brand` / `--color-brand` (terracota `#c2410c`) — CTAs, progreso, acentos
- **Neutros:** ivory & slate (Anthropic-inspired)
- Utilidades: `.page-hero`, `.brand-gradient-text`, `.kreo-surface-elevated`, `.page-stack`, `.filter-row`

## Capas Kreo (registry vendored)

### atoms (13)

Button, IconButton, InputText, Password, Avatar, StatusPill, Checkbox, Textarea, Select, **Skeleton**, **Loader**, **thinking-orb/**

- `Button`: variantes `default`, `brand`, `tactile`, `action-*`, `link` (underline draw), `asChild`
- `InputText`: `floatingLabel`, shake en `error`
- `Loader`: `spinner` | `orb` (IA) | `skeleton`

### molecules (14)

Card, PageHeader, StatsCard, EmptyState, Stepper, Progress, Sonner, Tooltip, MarkdownEditor, PageSkeleton, **Reveal**, **FocusRingGroup**, **AiThinkingPanel**

- `Reveal` / `StaggerGroup`: motion scroll Kreo
- `PageHeader`: reveal escalonado por bloque (`static` para desactivar)
- `FocusRingGroup`: anillo de foco spring en formularios

### organisms (4)

AppLayout, SidebarModern, DataTable, KanbanBoard

### layout (3)

DashboardShell, AuthShell, ImpersonationContextBar

## Motion system

Tokens en `theme/vars.css`: `--ease-spring-*`, `--press-fast`, `--stagger-step`  
Utilidades en `index.css`: `.kreo-floating-*`, `.kreo-focus-ring`, `.kreo-underline-draw`, `animate-kreo-*`

Auditoría completa: [`docs/UI-UX-AUDIT.md`](../docs/UI-UX-AUDIT.md)

Fuente: MCP Kreo workflow DEV (`pull_source_code_from_registry`).
