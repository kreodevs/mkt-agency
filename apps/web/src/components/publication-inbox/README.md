# Bandeja — componentes

| Archivo | Rol |
|---------|-----|
| `InboxItemCard.tsx` | Tarjeta con preview, aprobación SOHO y acciones rápidas |
| `InboxItemVisualPreview.tsx` | Imagen/video con `SocialPostMockup` |
| `SocialPostMockup.tsx` | Marco tipo red social (Instagram, LinkedIn, …) |
| `TodayPublishPanel.tsx` | **Hoy publicas esto** — prioridad del día |
| `SohoResultsBanner.tsx` | Contactos semana + enfoque estratégico |
| `InboxQuickPublishActions.tsx` | Copiar, abrir red, WhatsApp, link captura (UTM), regenerar |
| `InboxKitPanel.tsx` | Kit Copiar y Llevar (aprobadas) |

Hook: `hooks/useSohoBrowserNotifications.ts` — avisos del navegador para `week_ready`, `publish_reminder`, `approval_reminder`.

**Fase C pendiente (no en scope):** scheduling nativo Meta/LinkedIn, WhatsApp Business API, atribución lead↔post.
