# Home

- `AgencyHomePage` — `/agency-overview` (**Resumen** en menú vista completa)
  - **Superadmin:** panel de administración (tenants + enlace a modelos por tarea). Agentes y campañas solo vía impersonación.
  - **Tenant / impersonación:** escritorio con `StatsCard`, `EmptyState`, `StatusPill` y tokens Kreo (`--spacing-*`, `--success`, `--warning`).
  - Muestra el analizador web solo si el perfil no está completado y aún no hay actividad de marketing.
