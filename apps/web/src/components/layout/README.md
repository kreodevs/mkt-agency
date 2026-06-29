# Layout

- `DashboardShell` — envuelve páginas autenticadas con `AppLayout` Kreo, navegación superadmin/tenant, selector de impersonación en header y logout.
- **Superadmin:** sección Administración (tenants, paquetes, usuarios, auditoría, seguridad) y **Configuración IA** (proveedores LLM + modelos por tarea). Sin agentes ni marketing en nav.
- **Tenant / impersonación:** nav operativa con agentes, campañas y marketing.
