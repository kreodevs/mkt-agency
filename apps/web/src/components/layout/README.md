# Layout

- `DashboardShell` — envuelve páginas autenticadas con `AppLayout` Kreo, navegación superadmin/tenant, selector de impersonación en header y logout.
- En desktop (`lg+`), la sidebar va en capa `z-30` con overflow visible para que el botón de colapsar no quede detrás del header principal. La franja de brand y el header comparten `h-header` (4rem) para alinear el borde inferior.
- **Superadmin:** sección Administración (tenants, paquetes, usuarios, auditoría, seguridad) y **Configuración IA** (proveedores LLM + modelos por tarea). Sin agentes ni marketing en nav.
- **Tenant / impersonación:** nav operativa con agentes, campañas y marketing.
