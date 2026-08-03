# Ajustes e integraciones

## Qué es

Pantallas de **configuración del tenant** y del **superadmin** para redes, perfil operativo, dominios, competidores, LLM e integraciones externas.

## Para qué sirve

Adaptar el copiloto al negocio (redes y volumen), habilitar Growth, conectar búsqueda de competidores (Tavily), almacenamiento, dominios whitelabel y publicación n8n.

## Cómo usarlo

### Ajustes del copiloto (tenant)

**Ruta:** `/settings/copilot`

| Sección | Función |
|---------|---------|
| **Redes sociales** | Plataformas donde el CM genera copy (Instagram, LinkedIn, X, Facebook, TikTok) |
| **Publicaciones por semana** | Slider 1–14 posts (`communityManager.count`) |
| **Perfil operativo** | SOHO vs Growth, presupuesto pauta (`OperatingProfileCard`) |
| **Vista Growth** | Información si perfil Growth activo |

Persistencia CM: `PUT /community-manager/preferences` → `tenants.settings.communityManager`.

Toggle **vista avanzada** del menú: sidebar o preferencia en `store/copilot-ui.ts`.

### Competidores

**Ruta:** `/settings/competitors` (vista avanzada)

- Listar, registrar y eliminar competidores.
- **Descubrir con IA** — job async Tavily + LLM.
- Sincroniza con perfil de empresa para Competitor Intel.

Requisito superadmin: Tavily en `/admin/integrations`.

### Dominio whitelabel

**Ruta:** `/settings/domain`

- Registrar dominio custom del tenant.
- Ver instrucciones CNAME hacia `DOMAIN_CNAME_TARGET` (default `dashboard.mktagency.app`).
- Verificar DNS: `POST /domains/:id/verify-dns`.
- SSL: worker `ssl-provision` tras verificación (stub en dev con `DOMAIN_DNS_STUB=true`).

### Integración n8n (publicación)

Configuración **por producto**, no global — ver [Publicación n8n](../publicacion-n8n/README.md).

### Webhook inbox social (tenant)

**Ruta:** `/social/inbox` — tarjeta con datos de `GET /tenant/webhook-info`:

- URL: `/api/v1/social-inbox/webhook/:tenantId`
- Header: `X-Webhook-Secret`
- Body ejemplo incluido

Para automatizar ingesta desde Make/Zapier/n8n.

### Superadmin — plataforma

| Ruta | Función |
|------|---------|
| `/tenants` | CRUD tenants, impersonación |
| `/admin/packages` | Paquetes y límites |
| `/admin/users` | Usuarios globales |
| `/admin/audit-logs` | Auditoría |
| `/admin/security-events` | Eventos de seguridad |

### Superadmin — IA

| Ruta | Función |
|------|---------|
| `/admin/llm-providers` | Proveedores (OpenRouter, etc.), API keys |
| `/admin/llm-settings` | Modelo por tarea + fallback ante 429 |
| `/admin/llm-usage` | Consumo y costo estimado por tenant |
| `/admin/integrations` | Tavily Search, otras integraciones plataforma |

> Las variables `AI_API_URL`, `AI_API_KEY` y `AI_MODEL` del `.env` están **obsoletas** — todo LLM se configura en UI superadmin.

### Otras integraciones

| Integración | Configuración | Uso |
|-------------|---------------|-----|
| S3 / MinIO | `S3_*` en entorno | Librería y assets |
| Redis | `REDIS_URL` | Colas BullMQ (jobs, cron) |
| Slack seguridad | `SLACK_SECURITY_WEBHOOK_URL` | Alertas T-007 |
| Hermes propuestas | `HERMES_WEBHOOK_URL` | Notificar approve/reject propuestas |

### Propuestas y reportes (avanzado)

- `/proposals` — propuestas comerciales IA
- `/reports` — informes de rendimiento con polling

No forman parte del flujo SOHO diario.

## Qué pasa si...

| Situación | Comportamiento |
|-----------|----------------|
| Desmarcar todas las redes | UI exige al menos una |
| Growth sin presupuesto | `/agency/media-intents` redirige (`PaidProfileRedirect`) |
| DNS no verifica | Dominio queda pendiente; revisar CNAME |
| LLM 429 | Reintento con fallback configurado en llm-settings |
| Tavily sin configurar | Descubrimiento competidores falla o devuelve pocos resultados |

## Relacionado con

- [Copiloto y bandeja](../copiloto-bandeja/README.md)
- [Publicación n8n](../publicacion-n8n/README.md)
- [Agentes](../agentes/README.md)
- [Guía operativa](../operativa/README.md) — variables de entorno
- [Primeros pasos](../primeros-pasos/README.md)
