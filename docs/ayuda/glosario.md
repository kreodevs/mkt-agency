# Glosario — Mkt Agency OS

Términos usados en la aplicación, documentación y conversaciones de soporte.

---

## A

**Agente IA**  
Componente software que ejecuta tareas con LLM (Brand Analyst, Community Manager, Competitor Intel, etc.). Puede dispararse manualmente, por onboarding o por cron.

**Arte**  
Pieza de contenido individual en la bandeja (post para una red y fecha). Corresponde a un registro `contents` con versiones.

**Atribución (first touch / last touch)**  
Modelo para asignar crédito de conversión a canal o contenido según UTM guardados en metadata del lead. Disponible en perfil Growth (`GET /agency/attribution`).

**Auto-dispatch (n8n)**  
Envío automático al webhook n8n al aprobar un arte si la fecha programada es hoy y la opción está activa en el producto.

---

## B

**Bandeja de publicación**  
Pantalla principal `/` con contenidos pendientes, aprobados, rechazados y publicados. Hub operativo SOHO.

**Bootstrap**  
Creación del primer superadmin vía `/setup` (`POST /setup/init`). Solo una vez por instalación.

**Brand Analyst / Brand Brief**  
Agente de entrevista de marca que produce un documento `brandBriefMarkdown` usado por estrategia y CM.

**Bulk approve / bulk delete / purge**  
Operaciones masivas sobre contenidos de bandeja: aprobar varios, eliminar varios o vaciar por alcance (`all`, `pending`, `ready`, …).

---

## C

**Callback (n8n)**  
`POST /publication-inbox/webhook/:tenantId/mark-published` — n8n confirma publicación exitosa; establece `published_at`.

**CM virtual**  
Presentadora virtual (`cmCharacters` en metadata del producto) para posts TikTok formato talking-head.

**Community Manager (CM)**  
Agente que genera copy para redes según plataformas y volumen configurados.

**Competitor Intel**  
Agente que analiza competidores registrados y produce reportes estratégicos.

**Contenido (`content`)**  
Entidad versionada con copy, plataforma, formato visual, fechas y estados (draft, pending, approved, rejected, published).

**Copiloto SOHO**  
Modo UX simplificado: menú reducido, bandeja como inicio, publicación manual o n8n. Default para tenants SOHO.

**Copiar y Llevar**  
Flujo manual: copiar texto del post (y assets) al portapapeles y publicar en la red nativa.

---

## G

**Growth (perfil)**  
Subperfiles `growth_organic` y `growth_paid` con campañas, planes estratégicos y (con pauta) media intents.

---

## I

**Impersonación**  
Superadmin opera como tenant usando JWT con `impersonating: true` y usuario proxy. Patrón Kreo Eventos.

**Inbox social**  
`/social/inbox` — bandeja de interacciones sociales (comentarios/DMs) con ingesta manual o webhook.

---

## K

**Kit de medios (media kit)**  
Conjunto de assets vinculados a un producto (`product_media_kit_items`) para composición visual del CM.

---

## L

**Lead**  
Prospecto en CRM con etapa, score e interacciones. Origen: formulario, inbox social o alta manual.

**Librería**  
Repositorio tenant de assets en `/libreria` (carpetas, tags, subida S3).

**LLM task**  
Tarea configurable en superadmin (ej. `brand_interview`, `community_manager`, `competitor_discovery`, `video_generation`) con modelo y fallback.

---

## M

**Marcar publicado**  
Acción manual o callback que registra que el arte ya está en la red; quita de «Listas para publicar».

**Media intent**  
Registro stub de intención de campaña de pauta (`media_campaign_intents`) sin API Meta/Google en MVP.

---

## N

**n8n**  
Herramienta de automatización externa; Mkt Agency envía webhook por producto con copy, assets firmados y URL de callback.

**Notificación de agencia**  
Registro en `agency_notifications`: `week_ready`, `approval_reminder`, `publish_reminder`, `onboarding_complete`.

---

## O

**Onboarding (empresa)**  
Wizard `/onboarding` — perfil de company-profile (8 secciones, ≥80% activa).

**Onboarding (producto)**  
Wizard `/products/:id/onboarding` — activa pipeline de agentes al completar.

**Operating profile**  
Configuración tenant SOHO vs Growth y presupuesto pauta (`/tenant/operating-profile`).

**Orquestación semanal**  
Pipeline: métricas → estrategia → CM → imágenes. Cron lunes 06:00 o botón Preparar mi semana.

---

## P

**Paquete (package)**  
Plan de plataforma con límites asignado al tenant en superadmin.

**Platform admin**  
Superadmin asignado a un tenant (`tenant_platform_admins`) para impersonación sin owner.

**Preparar mi semana**  
`POST /publication-inbox/prepare-week` — dispara orquestación completa incluyendo competidores e intel.

**Producto-first**  
Modelo donde producto es entidad central; campañas, contenidos y leads pueden vincularse a `productId`.

**Propuesta (proposal)**  
Documento comercial IA en `/proposals` con flujo de firma; módulo avanzado.

**Purge**  
Limpieza de bandeja por alcance sin borrar el producto.

---

## S

**Scope (campaña)**  
`product` (vinculada a producto) o `brand` (marca tenant, sin productId).

**Secret (webhook)**  
Valor compartido en header `X-Webhook-Secret` para n8n e inbox social.

**SEO tags / keywords**  
Tags semánticos del producto (mín. 3 en onboarding); usados en descubrimiento de competidores.

**SOHO**  
Small Office Home Office — perfil operativo para negocio que publica manualmente; copiloto como UX principal.

**Superadmin**  
Administrador de plataforma multi-tenant; JWT sin `tenantId` salvo impersonación.

---

## T

**Tenant**  
Cliente aislado multi-tenant con usuarios, productos, bandeja y configuración propia.

**Tavily**  
Motor de búsqueda configurado en superadmin para descubrimiento de competidores.

---

## V

**Vista avanzada**  
Menú completo de agencia (campañas, contenidos, agentes hub, etc.). Toggle en sidebar o `mkt-advanced-nav` en localStorage.

**Visual format**  
Tipo de pieza visual: `image`, carrusel, `video`, `talking-head`, etc.

---

## W

**Webhook (publicación)**  
URL n8n configurada por producto; recibe payload `content.manual_publish` al publicar arte.

**Webhook (social inbox)**  
URL tenant para ingesta externa de interacciones sociales.

---

## Relacionado con

- [Hub de ayuda](./README.md)
