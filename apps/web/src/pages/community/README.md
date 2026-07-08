# Community Manager

Ruta: `/community` — `CommunityManagerPage.tsx`

Banner superior recomienda **Inicio → Preparar mi semana**; el formulario manual queda como opción avanzada.

UI alineada a tokens Kreo: `EmptyState`, iconos de plataforma neutros (`PLATFORM_ICON_TONE`), sin colores Tailwind por red.

- Selector de plataformas con botones toggle (icono + nombre); preferencias persistidas al activar/desactivar.
- Panel de prerrequisitos del perfil de empresa cuando falta contexto de marca.
- Errores de generación visibles (toast + tarjeta con enlace a `/admin/llm-settings`); invalida Contenidos y Calendario al crear posts.
