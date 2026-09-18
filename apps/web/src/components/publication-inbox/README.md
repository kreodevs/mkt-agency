# Bandeja — componentes

Alineados a tokens Kreo (`--spacing-*`, `--radius-*`, `--warning`, etc.) y moléculas `StatsCard`, `EmptyState`, `PageHeader`, `StatusPill`, `StaggerGroup`, `AiThinkingPanel`.

La página `PublicationInboxPage` envuelve listas (por aprobar, rechazadas, próximas) en `StaggerGroup` y muestra banner `AiThinkingPanel` mientras el copiloto prepara la semana.

| Archivo | Rol |
|---------|-----|
| `InboxItemCard.tsx` | Tarjeta resumida + etiqueta **Nuevo** tras generar + fechas programado/creado/actualizado + botón «Ver ficha completa» |
| `InboxItemMetadata.tsx` | Metadatos de fecha (programado, creado, actualizado) reutilizados en tarjeta y ficha |
| `InboxContentDetailDialog.tsx` | Ficha en modal; diseño de plantilla (`ContentVisualDesignPanel`), recomponer imagen (`ContentVisualPanel`), aprobación formal |
| `InboxItemVisualPreview.tsx` | Imagen/video con `SocialPostMockup`; prioriza `content.assets` (plantilla + media kit) sobre generaciones IA antiguas |
| `SocialPostMockup.tsx` | Marco tipo red social (Instagram, LinkedIn, …) |
| `TodayPublishPanel.tsx` | **Hoy publicas esto** — más recientes arriba + etiqueta **Nuevo** tras generar |
| `SohoCalendarDayPanel.tsx` | Publicaciones del día con **Aprobar/Rechazar** en cada tarjeta (inbox + `/calendar/:date`) |
| `SohoCalendarLegend.tsx` | Leyenda verde/amarillo/rojo del calendario |
| `SohoResultsBanner.tsx` | Contactos semana + enfoque estratégico |
| `InboxArtPublishBar.tsx` | CTA **Publicar este arte con n8n** debajo del mockup visual (por pieza) |
| `InboxQuickPublishActions.tsx` | Copiar, **Descargar arte(s)**, Abrir red, **Regenerar escena** (IA/mockup, mismo copy), **Recomponer** (solo plantillas tipográficas), menú «Más» con **Regenerar post completo** (copy + visual); n8n en `InboxArtPublishBar` |
| `InboxContentDeleteDialog.tsx` | Confirmación de borrado individual o en lote |
| `InboxPurgeDialog.tsx` | Limpiar bandeja por alcance (todo / por aprobar / listas / …) |
| `InboxKitPanel.tsx` | Kit Copiar y Llevar (aprobadas) |
| `InboxRejectFollowUpDialog.tsx` | Tras rechazar (SOHO): elegir otro formato o archivar |
| `RejectedInboxActions.tsx` | Acciones en tarjetas rechazadas (otro formato / archivar) |

Hook: `hooks/useSohoBrowserNotifications.ts` — avisos del navegador para `week_ready`, `publish_reminder`, `approval_reminder`.

**WhatsApp:** menú «Más» → copia texto, descarga visual si existe y abre `wa.me` (el archivo se adjunta manualmente con el clip; la API de enlace no soporta video).

**Fase C pendiente (no en scope):** scheduling nativo Meta/LinkedIn, WhatsApp Business API, atribución lead↔post.

## Calendarios: `/calendario` vs `/calendar`

| Ruta | Perfil | Propósito |
|------|--------|-----------|
| `/calendario` | SOHO / Copiloto | Vista semanal simplificada: qué publicar cada día, aprobar desde el panel del día, leyenda verde/amarillo/rojo |
| `/calendar` | Growth / Agencia | Calendario editorial completo con filtros, estados editoriales y flujo de contenidos |

No unificar rutas: el menú SOHO (`tenantSohoNavigation`) apunta solo a `/calendario`; el menú avanzado incluye `/calendar` bajo herramientas editoriales.
