# Bandeja — componentes

Alineados a tokens Kreo (`--spacing-*`, `--radius-*`, `--warning`, etc.) y moléculas `StatsCard`, `EmptyState`, `PageHeader`, `StatusPill`.

| Archivo | Rol |
|---------|-----|
| `InboxItemCard.tsx` | Tarjeta resumida + botón «Ver ficha completa» (modal con texto, visual y aprobación) |
| `InboxContentDetailDialog.tsx` | Ficha en modal; diseño de plantilla (`ContentVisualDesignPanel`), recomponer imagen (`ContentVisualPanel`), aprobación formal |
| `InboxItemVisualPreview.tsx` | Imagen/video con `SocialPostMockup`; marco centrado (`max-w` + `mx-auto`), `object-contain` sin recortar textos del creative |
| `SocialPostMockup.tsx` | Marco tipo red social (Instagram, LinkedIn, …) |
| `TodayPublishPanel.tsx` | **Hoy publicas esto** — prioridad del día |
| `SohoCalendarDayPanel.tsx` | Publicaciones del día con **Aprobar/Rechazar** en cada tarjeta (inbox + `/calendar/:date`) |
| `SohoCalendarLegend.tsx` | Leyenda verde/amarillo/rojo del calendario |
| `SohoResultsBanner.tsx` | Contactos semana + enfoque estratégico |
| `InboxArtPublishBar.tsx` | CTA **Publicar este arte con n8n** debajo del mockup visual (por pieza) |
| `InboxQuickPublishActions.tsx` | Copiar, Abrir red, menú «Más»; n8n primario va en `InboxArtPublishBar` |
| `InboxContentDeleteDialog.tsx` | Confirmación de borrado individual o en lote |
| `InboxPurgeDialog.tsx` | Limpiar bandeja por alcance (todo / por aprobar / listas / …) |
| `InboxKitPanel.tsx` | Kit Copiar y Llevar (aprobadas) |
| `InboxRejectFollowUpDialog.tsx` | Tras rechazar (SOHO): elegir otro formato o archivar |
| `RejectedInboxActions.tsx` | Acciones en tarjetas rechazadas (otro formato / archivar) |

Hook: `hooks/useSohoBrowserNotifications.ts` — avisos del navegador para `week_ready`, `publish_reminder`, `approval_reminder`.

**Fase C pendiente (no en scope):** scheduling nativo Meta/LinkedIn, WhatsApp Business API, atribución lead↔post.

## Calendarios: `/calendario` vs `/calendar`

| Ruta | Perfil | Propósito |
|------|--------|-----------|
| `/calendario` | SOHO / Copiloto | Vista semanal simplificada: qué publicar cada día, aprobar desde el panel del día, leyenda verde/amarillo/rojo |
| `/calendar` | Growth / Agencia | Calendario editorial completo con filtros, estados editoriales y flujo de contenidos |

No unificar rutas: el menú SOHO (`tenantSohoNavigation`) apunta solo a `/calendario`; el menú avanzado incluye `/calendar` bajo herramientas editoriales.
