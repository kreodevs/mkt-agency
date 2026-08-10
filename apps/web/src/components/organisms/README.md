# Organisms

Layout y bloques compuestos de la app.

## AppLayout + SidebarModern

- **AppLayout:** shell principal (`DashboardShell` lo envuelve). Main con gradiente brand sutil y `max-w-[1600px]`.
- **SidebarModern:** logo con `--gradient-brand`, nav activo en `--brand-muted` / `--brand-deep`.

## Patrón de página

1. `DashboardShell` → children
2. `PageHeader` con `eyebrow` contextual (Copiloto SOHO, Growth, Plataforma, Editorial…)
3. Contenido en `Card variant="elevated"` o `page-stack` / `filter-row` (`index.css`)
