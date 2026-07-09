# Inbox social

| Ruta | Componente |
|------|------------|
| `/social/inbox` | `SocialInboxPage` |

Ingesta manual de comentarios/DMs; clasificación de intención y puente a CRM.

## Componentes

| Archivo | Rol |
|---------|-----|
| `SocialInboxPage.tsx` | Página principal (SOHO + Growth) |
| `components/social/SocialInboxGuide.tsx` | Guía: qué es, para qué sirve, dónde configurar |

## Configuración relacionada

- **Redes para generar posts:** `/settings/copilot`
- **Webhook automático:** tarjeta en esta página (`GET /tenant/webhook-info`)
- **Leads:** `/leads`
