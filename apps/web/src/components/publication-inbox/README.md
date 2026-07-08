# Bandeja — componentes

Alineados a tokens Kreo (`--spacing-*`, `--radius-*`, `--warning`, etc.) y moléculas `StatsCard`, `EmptyState`, `PageHeader`, `StatusPill`.

| Archivo | Rol |
|---------|-----|
| `InboxItemCard.tsx` | Tarjeta resumida + botón «Ver ficha completa» (modal con texto, visual y aprobación) |
| `InboxContentDetailDialog.tsx` | Ficha completa en modal ancho con scroll y acciones de aprobación |
| `InboxItemVisualPreview.tsx` | Imagen/video con `SocialPostMockup`; hace polling mientras regenera |
| `SocialPostMockup.tsx` | Marco tipo red social (Instagram, LinkedIn, …) |
| `TodayPublishPanel.tsx` | **Hoy publicas esto** — prioridad del día |
| `SohoCalendarDayPanel.tsx` | Publicaciones de un día (inbox: listas, pendientes, próximas, **rechazadas** + `/calendar/:date`) |
| `SohoCalendarLegend.tsx` | Leyenda verde/amarillo/rojo del calendario |
| `SohoResultsBanner.tsx` | Contactos semana + enfoque estratégico |
| `InboxQuickPublishActions.tsx` | Copiar, abrir red, WhatsApp, link captura, **Otra versión** (copy + imagen) |
| `InboxKitPanel.tsx` | Kit Copiar y Llevar (aprobadas) |
| `InboxRejectFollowUpDialog.tsx` | Tras rechazar (SOHO): elegir otro formato o archivar |
| `RejectedInboxActions.tsx` | Acciones en tarjetas rechazadas (otro formato / archivar) |

Hook: `hooks/useSohoBrowserNotifications.ts` — avisos del navegador para `week_ready`, `publish_reminder`, `approval_reminder`.

**Fase C pendiente (no en scope):** scheduling nativo Meta/LinkedIn, WhatsApp Business API, atribución lead↔post.
