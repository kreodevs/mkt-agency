# Blueprint de Implementación — AgenteIA

## 1. Estructura del proyecto y stack
### Stack técnico (explícito del MDD §2)

| Capa                   | Tecnología                                       | Versión   | Propósito                                                          |
| :--------------------- | :----------------------------------------------- | :-------- | :----------------------------------------------------------------- |
| Backend runtime        | Node.js                                          | 20 LTS    | Entorno de ejecución                                               |
| Backend framework      | NestJS                                           | 10.x      | Monolito modular con soporte nativo de decoradores, DI y módulos   |
| Frontend               | React 18 + Vite 5 + Tailwind CSS 3.4 + Shadcn/ui | según MDD | Dashboard SPA con componentes reutilizables                        |
| Base de datos          | PostgreSQL                                       | 16        | Persistencia relacional con JSONB, índices parciales, particionado |
| Caché y colas          | Redis                                            | 7         | Caché de sesiones, rate limiting, colas BullMQ                     |
| Almacenamiento objetos | S3-compatible (DigitalOcean Spaces)              | —         | Assets multimedia con URLs firmadas                                |
| Orquestación           | Docker Compose + Dokploy                         | —         | Contenedores multi-entorno, autoescalado al 70% CPU                |
| Lenguaje               | TypeScript                                       | —         | Tipado fuerte en backend y frontend                                |
| ORM                    | TypeORM                                          | —         | Mapeo objeto-relacional con decoradores NestJS                     |
| CI/CD                  | GitHub Actions                                   | —         | Build, test, deploy automático con rolling update                  |
| Monitoreo              | Prometheus + Grafana + Loki                      | —         | Métricas, logs, alertas vía Slack                                  |

### Árbol de directorios (Monolito Modular — NestJS)
```text
agenteia/
├── apps/
│   ├── backend/                      # NestJS Monolito Modular
│   │   └── src/
│   │       ├── modules/
│   │       │
├── auth/             # Autenticación, JWT, sesiones
│   │       │
├── tenant/           # Gestión multi-tenant, superadmin
│   │       │
├── company-profile/  # Onboarding progresivo
│   │       │
├── campaign/         # Campañas, plantillas, presupuestos
│   │       │
├── content/          # Contenido, versionado, aprobaciones
│   │       │
├── calendar/         # Calendario Editorial Dinámico
│   │       │
├── crm/              # Leads, pipeline, scoring IA
│   │       │
├── forms/            # Formularios embebidos, captura
│   │       │
├── assets/           # Librería multimedia, S3
│   │       │
├── proposals/        # Propuestas comerciales IA
│   │       │
├── ai-agents/        # Orquestación de agentes IA
│   │       │
├── competitors/      # Monitoreo de competencia
│   │       │
├── domains/          # Dominios personalizados (CNAME)
│   │       │
├── reports/          # Informes y KPIs
│   │       │
├── security/         # Auditoría, eventos de seguridad
│   │       │
└── shared/           # Kernel compartido (VOs, utilidades)
│   │
├── common/               # Guards, interceptors, filtros
│   │
├── core/                 # Capa de aplicación (CQRS bus, puertos)
│   │
├── domain/               # Entidades puras, reglas de negocio
│   │
├── infrastructure/       # Adaptadores (PostgreSQL, Redis, S3, APIs IA)
│   │       └── main.ts
│   └── frontend/                     # React 18 + Vite 5
│       └── src/
│           ├── components/           # Shadcn/ui + Tailwind
│           ├── hooks/                # TanStack Query, Zustand
│           ├── pages/                # Lazy loading por módulo
│           └── lib/                  # API client, helpers
├── packages/                         # (opcional) librerías compartidas
├── docker-compose.yml
└── .github/workflows/                # CI/CD pipelines

```
### Patrones activos (SSOT del MDD)

- **Arquitectura Hexagonal (Ports & Adapters):** Capa de dominio sin dependencias externas; puertos en aplicación; adaptores en infraestructura.
- **Monolito Modular:** Unidad de despliegue única con módulos de negocio independientes (cada uno con su propio subdominio).
- **CQRS:** Commands para mutaciones, Queries para lecturas; buses separados.
- **Adapter:** Adaptadores para APIs externas de IA (TokenLab, OpenRouter, Replicate, ElevenLabs), S3, Redis.
- **Facade (Fachada):** Fachadas en cada módulo para exponer una interfaz simplificada al resto del sistema.
- **Command:** Cada operación de escritura encapsulada como comando (e.g. `CreateCampaignCommand`, `ApproveContentCommand`).
- **Observer / Pub-Sub:** Eventos de dominio publicados mediante Outbox → BullMQ → workers.
- **State:** Máquinas de estado para campañas, contenidos, aprobaciones, propuestas.
- **Strategy:** Algoritmos intercambiables para scoring de leads, selección de modelo IA, estrategias de presupuesto.
- **Repository:** Interfaces de repositorio en dominio; implementaciones TypeORM en infraestructura.
- **Outbox Pattern:** Eventos de dominio escritos en `outbox` dentro de la misma transacción, publicados asincrónicamente.
- **Event Sourcing:** Estados reconstruidos desde `events` (append-only); `events` como única fuente de verdad para agregados.

## 2. Persistencia y datos

### Cobertura §3: lista nominal de todas las entidades del modelo

Cada una de las siguientes tablas está definida en el SQL del MDD §3. Para columnas, tipos e índices completos, ver §3 del MDD.

- tenants
- users
- sessions
- company_profiles
- company_profile_sections
- campaign_templates
- campaigns
- budgets
- audiences
- contents
- content_versions
- content_approvals
- ads
- posts
- forms
- form_submissions
- leads
- lead_interactions
- asset_folders
- asset_tags
- assets
- asset_tag_assignments
- competitors
- competitor_mentions
- ai_agents
- agent_assignments
- proposals
- reports
- custom_domains
- dns_verifications
- local_pages
- impersonation_logs
- audit_logs
- security_events
- outbox
- events

### Índices y notas

- **Índices multitenant:** `tenant_id` indexado en todas las tablas que lo contienen (BTREE).
- **Índices de búsqueda:** `campaigns(tenant_id, status)`, `leads(tenant_id, stage)`, `content_versions(content_id, version_number DESC)`.
- **Índices de auditoría:** `audit_logs(tenant_id, created_at DESC)`, `security_events(severity, created_at DESC)`.
- **Índices de outbox:** `outbox(status, created_at)` para procesamiento eficiente.
- **Índice eventos:** `events(aggregate_type, aggregate_id, version)` para reconstrucción de estados.
- **Auditoría:** Las tablas `audit_logs`, `security_events`, `events`, `lead_interactions` y `content_versions` son append-only (sin actualizaciones ni eliminaciones).
- **Seguridad:** `password_hash` usa Argon2id; `refresh_token_hash` usa SHA-256; JWT nunca se persiste.
- **FK circular resuelta:** `contents.current_version_id` se añade mediante ALTER TABLE después de crear `content_versions`.

## 3. Mapa de contratos API (MDD §4) → módulos

| Método | Ruta                                               | Módulo NestJS         | Notas                                              |
| :----- | :------------------------------------------------- | :-------------------- | :------------------------------------------------- |
| GET    | /api/v1/health                                     | HealthModule          | Sin auth; verifica DB + Redis + S3                 |
| GET    | /api/v1/setup/status                               | TenantModule          | Sin auth; solo disponible si no hay superadmin     |
| POST   | /api/v1/setup/init                                 | TenantModule          | Sin auth; crea primer superadmin (bootstrap)       |
| GET    | /api/v1/auth/jwks                                  | AuthModule            | Sin auth; claves públicas RS256                    |
| POST   | /api/v1/auth/login                                 | AuthModule            | Sin auth; valida credenciales, emite JWT + refresh |
| POST   | /api/v1/auth/refresh                               | AuthModule            | Sin auth; rota refresh token                       |
| POST   | /api/v1/auth/logout                                | AuthModule            | JWT; invalida sesión                               |
| GET    | /api/v1/users/me                                   | AuthModule            | JWT; perfil del usuario autenticado                |
| PATCH  | /api/v1/users/me                                   | AuthModule            | JWT; actualiza perfil                              |
| POST   | /api/v1/tenants                                    | TenantModule          | JWT+SA; crear tenant                               |
| GET    | /api/v1/tenants                                    | TenantModule          | JWT+SA; listar tenants                             |
| GET    | /api/v1/tenants/:id                                | TenantModule          | JWT+SA; detalle tenant                             |
| PATCH  | /api/v1/tenants/:id                                | TenantModule          | JWT+SA; actualizar tenant                          |
| DELETE | /api/v1/tenants/:id                                | TenantModule          | JWT+SA; eliminar tenant                            |
| POST   | /api/v1/superadmin/impersonate                     | TenantModule          | JWT+SA; iniciar impersonalización                  |
| DELETE | /api/v1/superadmin/impersonate                     | TenantModule          | JWT+SA; finalizar impersonalización                |
| GET    | /api/v1/company-profile                            | CompanyProfileModule  | JWT; perfil de empresa                             |
| PATCH  | /api/v1/company-profile                            | CompanyProfileModule  | JWT; actualizar perfil                             |
| GET    | /api/v1/company-profile/sections                   | CompanyProfileModule  | JWT; listar secciones onboarding                   |
| PATCH  | /api/v1/company-profile/sections/:key              | CompanyProfileModule  | JWT; actualizar sección                            |
| POST   | /api/v1/company-profile/sections/:key/suggest      | CompanyProfileModule  | JWT; sugerencia IA para sección                    |
| GET    | /api/v1/campaign-templates                         | CampaignModule        | JWT; listar plantillas                             |
| POST   | /api/v1/campaign-templates                         | CampaignModule        | JWT; crear plantilla                               |
| GET    | /api/v1/campaign-templates/:id                     | CampaignModule        | JWT; detalle plantilla                             |
| PATCH  | /api/v1/campaign-templates/:id                     | CampaignModule        | JWT; actualizar plantilla                          |
| DELETE | /api/v1/campaign-templates/:id                     | CampaignModule        | JWT; eliminar plantilla                            |
| GET    | /api/v1/campaigns                                  | CampaignModule        | JWT; listar campañas                               |
| POST   | /api/v1/campaigns                                  | CampaignModule        | JWT; crear campaña                                 |
| GET    | /api/v1/campaigns/:id                              | CampaignModule        | JWT; detalle campaña                               |
| PATCH  | /api/v1/campaigns/:id                              | CampaignModule        | JWT; actualizar campaña                            |
| DELETE | /api/v1/campaigns/:id                              | CampaignModule        | JWT; eliminar campaña (solo draft)                 |
| POST   | /api/v1/campaigns/:id/generate-strategy            | CampaignModule        | JWT; IA genera estrategia y presupuesto            |
| GET    | /api/v1/campaigns/:id/budgets                      | CampaignModule        | JWT; listar presupuestos                           |
| PATCH  | /api/v1/campaigns/:id/budgets/:budgetId            | CampaignModule        | JWT; aprobar/rechazar presupuesto                  |
| GET    | /api/v1/audiences                                  | CampaignModule        | JWT; listar audiencias                             |
| POST   | /api/v1/audiences                                  | CampaignModule        | JWT; crear audiencia                               |
| PATCH  | /api/v1/audiences/:id                              | CampaignModule        | JWT; actualizar audiencia                          |
| DELETE | /api/v1/audiences/:id                              | CampaignModule        | JWT; eliminar audiencia                            |
| GET    | /api/v1/calendar                                   | CalendarModule        | JWT; query month/year                              |
| GET    | /api/v1/calendar/:date                             | CalendarModule        | JWT; Detalle del Día                               |
| GET    | /api/v1/contents                                   | ContentModule         | JWT; listar contenidos                             |
| POST   | /api/v1/contents                                   | ContentModule         | JWT; crear borrador                                |
| GET    | /api/v1/contents/:id                               | ContentModule         | JWT; detalle contenido                             |
| PATCH  | /api/v1/contents/:id                               | ContentModule         | JWT; actualizar (crea nueva versión)               |
| DELETE | /api/v1/contents/:id                               | ContentModule         | JWT; eliminar contenido                            |
| GET    | /api/v1/contents/:id/versions                      | ContentModule         | JWT; historial de versiones                        |
| GET    | /api/v1/contents/:id/versions/:vid                 | ContentModule         | JWT; versión específica                            |
| POST   | /api/v1/contents/:id/versions/:vid/approve         | ContentModule         | JWT; firma digital (Kill Switch)                   |
| POST   | /api/v1/contents/:id/versions/:vid/reject          | ContentModule         | JWT; rechazar versión                              |
| POST   | /api/v1/contents/:id/versions/:vid/request-changes | ContentModule         | JWT; solicitar cambios                             |
| POST   | /api/v1/contents/:id/revert/:vid                   | ContentModule         | JWT; revertir a versión anterior                   |
| GET    | /api/v1/ads                                        | ContentModule (Ads)   | JWT; listar anuncios                               |
| POST   | /api/v1/ads                                        | ContentModule         | JWT; crear anuncio                                 |
| PATCH  | /api/v1/ads/:id                                    | ContentModule         | JWT; actualizar anuncio                            |
| POST   | /api/v1/ads/:id/mark-ready                         | ContentModule         | JWT; marcar listo                                  |
| GET    | /api/v1/posts                                      | ContentModule (Posts) | JWT; listar posts                                  |
| POST   | /api/v1/posts                                      | ContentModule         | JWT; crear post                                    |
| PATCH  | /api/v1/posts/:id                                  | ContentModule         | JWT; actualizar post                               |
| GET    | /api/v1/leads                                      | CRMModule             | JWT; pipeline CRM                                  |
| GET    | /api/v1/leads/:id                                  | CRMModule             | JWT; detalle lead                                  |
| PATCH  | /api/v1/leads/:id/stage                            | CRMModule             | JWT; avanzar etapa                                 |
| PATCH  | /api/v1/leads/:id                                  | CRMModule             | JWT; actualizar datos                              |
| DELETE | /api/v1/leads/:id                                  | CRMModule             | JWT; eliminar lead                                 |
| GET    | /api/v1/leads/:id/interactions                     | CRMModule             | JWT; historial interacciones                       |
| GET    | /api/v1/forms                                      | FormsModule           | JWT; listar formularios                            |
| POST   | /api/v1/forms                                      | FormsModule           | JWT; crear formulario                              |
| GET    | /api/v1/forms/:id                                  | FormsModule           | JWT; detalle formulario                            |
| PATCH  | /api/v1/forms/:id                                  | FormsModule           | JWT; actualizar formulario                         |
| DELETE | /api/v1/forms/:id                                  | FormsModule           | JWT; eliminar formulario                           |
| GET    | /api/v1/forms/:id/snippet                          | FormsModule           | JWT; obtener snippet JS                            |
| POST   | /api/v1/forms/:id/submit                           | FormsModule           | Sin auth; público, crea lead                       |
| GET    | /api/v1/forms/:id/submissions                      | FormsModule           | JWT; listar envíos                                 |
| GET    | /api/v1/assets                                     | AssetsModule          | JWT; listar activos                                |
| POST   | /api/v1/assets/upload                              | AssetsModule          | JWT; subida multipart                              |
| GET    | /api/v1/assets/:id                                 | AssetsModule          | JWT; metadatos                                     |
| PATCH  | /api/v1/assets/:id                                 | AssetsModule          | JWT; actualizar metadatos                          |
| DELETE | /api/v1/assets/:id                                 | AssetsModule          | JWT; eliminar (solo si reference_count=0)          |
| GET    | /api/v1/assets/:id/download-url                    | AssetsModule          | JWT; URL firmada S3 (1 hora)                       |
| POST   | /api/v1/assets/:id/duplicate                       | AssetsModule          | JWT; duplicar activo                               |
| GET    | /api/v1/asset-folders                              | AssetsModule          | JWT; listar carpetas                               |
| POST   | /api/v1/asset-folders                              | AssetsModule          | JWT; crear carpeta                                 |
| PATCH  | /api/v1/asset-folders/:id                          | AssetsModule          | JWT; renombrar/mover                               |
| DELETE | /api/v1/asset-folders/:id                          | AssetsModule          | JWT; eliminar carpeta                              |
| GET    | /api/v1/competitors                                | CompetitorsModule     | JWT; listar competidores                           |
| POST   | /api/v1/competitors                                | CompetitorsModule     | JWT; registrar competidor                          |
| DELETE | /api/v1/competitors/:id                            | CompetitorsModule     | JWT; eliminar competidor                           |
| GET    | /api/v1/competitors/:id/mentions                   | CompetitorsModule     | JWT; menciones                                     |
| GET    | /api/v1/ai-agents                                  | AIAgentsModule        | JWT; listar agentes IA                             |
| PATCH  | /api/v1/ai-agents/:id                              | AIAgentsModule        | JWT+SA; actualizar configuración                   |
| GET    | /api/v1/agent-assignments                          | AIAgentsModule        | JWT; listar asignaciones                           |
| POST   | /api/v1/proposals                                  | ProposalsModule       | JWT; solicitar propuesta IA                        |
| GET    | /api/v1/proposals                                  | ProposalsModule       | JWT; listar propuestas                             |
| GET    | /api/v1/proposals/:id                              | ProposalsModule       | JWT; detalle propuesta                             |
| POST   | /api/v1/proposals/:id/sign                         | ProposalsModule       | JWT; firmar digitalmente                           |
| POST   | /api/v1/proposals/:id/reject                       | ProposalsModule       | JWT; rechazar propuesta                            |
| GET    | /api/v1/reports                                    | ReportsModule         | JWT; listar reportes                               |
| POST   | /api/v1/reports                                    | ReportsModule         | JWT; solicitar generación IA                       |
| GET    | /api/v1/reports/:id                                | ReportsModule         | JWT; obtener reporte                               |
| POST   | /api/v1/domains                                    | DomainsModule         | JWT; configurar dominio personalizado              |
| GET    | /api/v1/domains                                    | DomainsModule         | JWT; listar dominios                               |
| GET    | /api/v1/domains/:id                                | DomainsModule         | JWT; estado del dominio                            |
| DELETE | /api/v1/domains/:id                                | DomainsModule         | JWT; eliminar dominio                              |
| POST   | /api/v1/domains/:id/verify-dns                     | DomainsModule         | JWT; verificar registro DNS                        |
| GET    | /api/v1/local-pages                                | DomainsModule         | JWT; listar páginas locales SEO                    |
| POST   | /api/v1/local-pages                                | DomainsModule         | JWT; crear página local                            |
| PATCH  | /api/v1/local-pages/:id                            | DomainsModule         | JWT; actualizar página local                       |
| DELETE | /api/v1/local-pages/:id                            | DomainsModule         | JWT; eliminar página local                         |
| GET    | /api/v1/audit-logs                                 | SecurityModule        | JWT+SA; logs de auditoría                          |
| GET    | /api/v1/security-events                            | SecurityModule        | JWT+SA; eventos de seguridad                       |
| POST   | /api/v1/admin/sessions/invalidate                  | SecurityModule        | JWT+SA; invalidar sesiones de usuario              |

## 4. Componentes transversales (pipeline, IA, grafo)

### 4.1 Orquestación de agentes IA (AIAgentsModule)

- **Entrada:** Comando `GenerateStrategyCommand`, `SuggestSectionCommand`, `GenerateProposalCommand`
- **Proceso:** El comando persiste un `agent_assignment` con estado `pending`; un worker BullMQ recoge la asignación, invoca el adaptador IA correspondiente (Strategy, Copy, Image via OpenRouter/Replicate/TokenLab/ElevenLabs) y actualiza el resultado en `agent_assignments.result`.
- **Salida:** Estrategia JSON, presupuesto generado, propuesta comercial, contenido sugerido.
- **Dependencias:** Redis (BullMQ), adaptadores IA en infraestructura, tabla `ai_agents` para configuración de modelos.
- **Fallos:** Timeout (read 120s), circuit breaker (5 fallos consecutivos → open 60s), reintentos 3 con backoff exponencial. Si falla, `agent_assignments.status` pasa a `failed` y se registra evento en `security_events`.

### 4.2 Outbox Pattern y Event Sourcing

- **Outbox:** Cada comando que genera un evento de dominio escribe en la tabla `outbox` dentro de la misma transacción que la operación de negocio. Un worker dedicado (BullMQ) lee `outbox` donde `status='pending'`, publica el evento en Redis/BullMQ para consumidores (notificaciones, actualización de calendario, recomputación de scoring) y marca `status='processed'`.
- **Event Sourcing:** Todos los cambios de estado de agregados (campañas, contenidos, leads) se persisten como eventos en la tabla `events` (append-only). El estado actual se reconstruye aplicando eventos en orden de versión.
- **Fallos de outbox:** Reintentos hasta 5 veces; si persiste, alerta al operador vía Slack. Eventos huérfanos se detectan con healthcheck.

### 4.3 Pipeline de generación y aprobación de contenido

1. Cliente solicita generación de estrategia → comando → worker IA escribe resultado → evento `StrategyGenerated`.
2. Agente de copywriting genera contenido → se crea `content_version` en estado `draft`.
3. Calendario Editorial muestra slots con colores según estado.
4. Cliente aprueba → comando `ApproveContentCommand` → cálculo SHA-256 sobre `body + "|" + version_id + "|" + asset_ids_ordenados` → `content_approvals` y `content_versions.signature_hash` actualizados → contenido congelado.
5. Kit de descarga liberado.
6. Si se modifica contenido aprobado → se crea nueva versión, firma anterior inválida, estado `in_changes`.

### 4.4 Sincronización de almacenes (no aplica)

El MDD no define un almacén grafo ni PostGIS, por lo que no hay sincronización entre PostgreSQL y otro motor. Todos los datos residen en PostgreSQL 16.

### 4.5 Integración con APIs externas (nombradas en MDD §1)

- **TokenLab, OpenRouter, Replicate:** Adaptadores en infraestructura con interfaz `IAProviderPort`. Selección según `ai_agents.model_config`.
- **ElevenLabs:** Generación de voz para contenido multimedia (futuro).
- **DigitalOcean Spaces (S3):** Subida de assets mediante URLs firmadas de 1 hora.
- **Let's Encrypt:** Certificados SSL automáticos para dominios personalizados.

### 4.6 Monitoreo de competencia

- Worker periódico (diario) que consulta menciones de competidores configurados y almacena en `competitor_mentions`.
- Entrada: lista de competidores del tenant.
- Salida: menciones con sentimiento y fuente.

## 5. Seguridad en despliegue

- **TLS 1.3** en todas las comunicaciones externas; certificados Let's Encrypt automáticos; HSTS max-age 1 año.
- **Autenticación JWT RS256:** access token 15 min (solo en memoria del cliente, nunca persistido), refresh token 7 días (almacenado como SHA-256 en `sessions`; rotado en cada uso).
- **Protección de contraseñas:** Argon2id (cost=auto, memory=64MB, parallelism=4) en `users.password_hash`.
- **Bloqueo de cuenta:** 5 intentos fallidos consecutivos → bloqueo 15 min; reseteo al iniciar sesión.
- **DTOs con whitelist:** Validación mediante Pipes de NestJS (class-validator + class-transformer); sanitización anti-XSS en campos de texto generados por IA.
- **RBAC:** Roles `owner`, `manager`, `viewer` verificados en guard personalizado a partir de claims JWT. Superadmin con permisos globales.
- **Rate limiting distribuido (Redis):** 100 req/min público, 1000 req/min autenticado, 20 req/min endpoints IA.
- **CSRF:** Tokens de doble sumisión en cookies y cabeceras personalizadas en mutaciones.
- **Secretos:** Gestionados en Hashicorp Vault; inyectados como variables de entorno en runtime. No expuestos al frontend.
- **Logs estructurados:** `audit_logs` (operaciones CRUD) y `security_events` (eventos críticos) ambos append-only, retención mínima 90 días.
- **Impersonalización:** Token temporal de 1 hora; todas las acciones registradas en `impersonation_logs`; banner visible "IMPERSONANDO".
- **Protección de assets:** Eliminación bloqueada si `is_in_use=TRUE` o `reference_count>0`.
- **Superadmin mínimo:** Validación en dominio antes de eliminar el último superadmin.
- **Cifrado en reposo:** PostgreSQL TDE y S3 AES-256; URLs firmadas expiran en 1 hora.

## 6. Riesgos y mitigaciones (trazabilidad §5)

| Riesgo (§5)                                                  | Mitigación en diseño                                                                                                                                                                                                |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependencia APIs IA externas (caídas, cambios de precio)     | Adaptadores con circuit breaker (5 fallos → open 60s), colas de reintentos con backoff exponencial (1s, 4s, 16s), healthchecks cada 30s                                                                             |
| Envío accidental de PII a APIs externas                      | Adaptador de anonimización que pseudonimiza email/teléfono antes de enviar; filtro de datos en puerto de salida; políticas contractuales de no retención                                                            |
| Curva de aprendizaje del flujo de aprobación                 | Onboarding guiado con tips contextuales, UX simplificada, recordatorios automáticos vía notificaciones                                                                                                              |
| Fuga de datos entre tenants                                  | `tenant_id` en todas las tablas sensibles con índice obligatorio; middleware que inyecta tenant_id desde JWT en contexto de petición; repositorios filtran siempre por tenant_id; pruebas de penetración periódicas |
| Refresh token robado (rotación falla)                        | Detección de reutilización: si se usa un refresh token ya invalidado, se invalidan TODAS las sesiones del usuario y se registra `security_event` de severidad `critical`                                            |
| Caída de BD durante aprobación                               | Cálculo de hash y escritura en misma transacción; ante fallo, rollback automático; cliente recibe 503 y debe reintentar (operación idempotente)                                                                     |
| Asset referenciado en contenido aprobado no puede eliminarse | `DELETE /assets/:id` verifica `is_in_use` y `reference_count`; retorna 409 si está en uso; usuario debe reemplazar referencias o archivar                                                                           |

## 7. Plan de implementación por fases

### Fase 1: Fundación del proyecto y esquema de datos
- Inicializar repositorio con Docker Compose (PostgreSQL 16, Redis 7, MinIO).
- Configurar NestJS con TypeORM, módulo compartido, guards globales.
- Ejecutar migraciones SQL del §3 (DDL completo con índices, FK circulares resueltas).
- Implementar `HealthModule` y endpoints de setup (`/setup/status`, `/setup/init`).
- **Dependencia:** Ninguna; base para todo.

### Fase 2: Autenticación y multi-tenant
- Módulo `AuthModule`: login con Argon2id, JWT RS256, refresh token rotation, bloqueo de cuenta.
- Módulo `TenantModule`: CRUD de tenants, gestión de usuarios, constraint de superadmin.
- Middleware de tenant_id en contexto; guards RBAC.
- Endpoints `/auth/*`, `/tenants/*`, `/users/*`, `/superadmin/*`.
- **Dependencia:** Fase 1.

### Fase 3: Onboarding y perfil de empresa
- Módulo `CompanyProfileModule`: cuestionario progresivo con secciones.
- Worker de sugerencia IA para secciones (invoca adaptador IA).
- Cálculo de `completion_percentage` y activación automática al ≥80%.
- Endpoints `/company-profile/*`.
- **Dependencia:** Fase 2 (tenant autenticado).

### Fase 4: Campañas, plantillas y presupuestos
- Módulo `CampaignModule`: CRUD de campañas, plantillas, audiencias, presupuestos.
- Comando `GenerateStrategyCommand` → worker IA genera estrategia y presupuesto.
- Endpoints `/campaigns/*`, `/campaign-templates/*`, `/audiences/*`.
- **Dependencia:** Fase 3 (perfil de empresa necesario para estrategia IA).

### Fase 5: Contenido, versionado y aprobaciones (Kill Switch)
- Módulo `ContentModule`: CRUD de contenido, versionado inmutable, historial de versiones.
- Comando `ApproveContentCommand` con firma digital SHA-256.
- Calendario Editorial Dinámico (`CalendarModule`).
- Endpoints `/contents/*`, `/calendar/*`, `/ads/*`, `/posts/*`.
- **Dependencia:** Fase 4 (contenido asociado a campañas).

### Fase 6: CRM, formularios y scoring IA
- Módulo `CRMModule`: pipeline de leads, scoring IA (recalculado en cada interacción).
- Módulo `FormsModule`: formularios embebidos con snippet JS, endpoint público `/submit`.
- Endpoints `/leads/*`, `/forms/*`.
- **Dependencia:** Fase 3 (tenant activo).

### Fase 7: Librería de activos multimedia
- Módulo `AssetsModule`: subida S3 con URLs firmadas, carpetas, etiquetas, duplicación.
- Validación de tamaño según plan (`max_assets_size`).
- Endpoints `/assets/*`, `/asset-folders/*`.
- **Dependencia:** Fase 2 (tenant autenticado).

### Fase 8: Propuestas, reportes, competencia, dominios, auditoría
- Módulos `ProposalsModule`, `ReportsModule`, `CompetitorsModule`, `DomainsModule`, `SecurityModule`.
- Workers para generación de reportes IA, monitoreo de competencia, verificación DNS.
- Endpoints de superadmin para auditoría y seguridad.
- **Dependencia:** Fases 4–6 (propuestas usan campañas, reportes usan datos de CRM y campañas).


### Cobertura del modelo (MDD §3) — entidades inyectadas automáticamente

### plaintext_password


## 8. Checklist de verificación del Blueprint

- ✅ Sec 1: Stack técnico listado con tecnologías y versiones del MDD §2
- ✅ Sec 2: Lista nominal de TODAS las entidades del MDD §3 presente en viñetas (ninguna omitida)
- ✅ Sec 3: Tabla API completa con cada endpoint del MDD §4 en una fila
- ✅ Sec 4: Componentes transversales cubiertos (orquestación IA, outbox/event sourcing, pipeline de aprobación, monitoreo competencia)
- ✅ Sec 5: Seguridad en despliegue alineada con MDD §6 (TLS, JWT, Argon2id, rate limiting, RBAC, vault, logs)
- ✅ Sec 6: Riesgos y mitigaciones trazados a MDD §5 (5 riesgos con mitigaciones explícitas)
- ✅ Sec 7: Plan de implementación por fases con dependencias (8 fases ordenadas)
- ✅ Autocontenido: Sin frases como "ver §X", "véase §X", "remite al MDD" (salvo remisiones explícitas a §3 para columnas SQL)

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                         |
| :------ | :--------- | :------------------------------------------------------------- |
| 1.0     | Abril 2026 | Creación inicial del Blueprint de implementación para AgenteIA |

## 8. UI Design System & Component Mapping

> Esta sección es generada automáticamente mediante enriquecimiento semántico del modelo de datos. Proporciona directrices para la instanciación de componentes UI basándose en la naturaleza de cada entidad del dominio.

### Entity-to-Component Mapping

| Entidad (MDD) | Semántica de UI | Componente Recomendado | Contrato de Datos (Props) |
|---|---|---|---|
| `sessions` | Proceso (draft → active → completed → archived) | `KanbanBoard` | columns=4 estados, rows=entity[] |
| `campaign_templates` | Proceso (draft → active → completed → archived) | `KanbanBoard` | columns=4 estados, rows=entity[] |
| `campaigns` | Proceso (draft → active → completed → archived) | `KanbanBoard` | columns=4 estados, rows=entity[] |
| `content_approvals` | Proceso (draft → active → completed → archived) | `KanbanBoard` | columns=4 estados, rows=entity[] |
| `leads` | Proceso (new → contacted → qualified → converted → lost) | `KanbanBoard` | columns=5 estados, rows=entity[] |
| `lead_interactions` | Proceso (new → contacted → qualified → converted → lost) | `KanbanBoard` | columns=5 estados, rows=entity[] |
| `audit_logs` | Proceso (draft → active → completed → archived) | `KanbanBoard` | columns=4 estados, rows=entity[] |
| `tenants` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/tenants, columns=fields[] |
| `users` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/users, columns=fields[] |
| `company_profiles` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/company_profiles, columns=fields[] |
| `company_profile_sections` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/company_profile_sections, columns=fields[] |
| `budgets` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/budgets, columns=fields[] |
| `audiences` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/audiences, columns=fields[] |
| `contents` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/contents, columns=fields[] |
| `content_versions` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/content_versions, columns=fields[] |
| `ads` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/ads, columns=fields[] |
| `posts` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/posts, columns=fields[] |
| `forms` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/forms, columns=fields[] |
| `form_submissions` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/form_submissions, columns=fields[] |
| `asset_folders` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/asset_folders, columns=fields[] |
| `asset_tags` | Registro CRUD | `ReferenceTable` | dataSource=GET /api/v1/asset_tags, columns=fields[] |
| `assets` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/assets, columns=fields[] |
| `asset_tag_assignments` | Registro CRUD | `ReferenceTable` | dataSource=GET /api/v1/asset_tag_assignments, columns=fields[] |
| `competitors` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/competitors, columns=fields[] |
| `competitor_mentions` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/competitor_mentions, columns=fields[] |
| `ai_agents` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/ai_agents, columns=fields[] |
| `agent_assignments` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/agent_assignments, columns=fields[] |
| `proposals` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/proposals, columns=fields[] |
| `reports` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/reports, columns=fields[] |
| `custom_domains` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/custom_domains, columns=fields[] |
| `dns_verifications` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/dns_verifications, columns=fields[] |
| `local_pages` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/local_pages, columns=fields[] |
| `impersonation_logs` | Registro CRUD | `AuditList` | dataSource=GET /api/v1/impersonation_logs, columns=fields[] |
| `security_events` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/security_events, columns=fields[] |
| `outbox` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/outbox, columns=fields[] |
| `events` | Registro CRUD | `DataTable` | dataSource=GET /api/v1/events, columns=fields[] |

### Reglas de Renderizado (UI Constraints)

1. **Prioridad de componente:**
   - Entidades `WorkflowProcess` → **KanbanBoard** (prohibido renderizar como tabla plana).
   - Entidades `DataRegistry` → **DataTable** con filtros y paginación.
   - Entidades `Configuration` → **PropertyGrid** con secciones colapsables.
   - Historiales / logs de eventos → **AuditList** o **ChatTimeline**.
1. **Estándar de formularios:**
   - Todos los formularios deben usar **React Hook Form** + **Zod** para validación.
   - Schemas derivados directamente del contrato de datos de la entidad.
1. **Responsive design para tablas:**
   - En viewports menores a 768px, las `DataTable` deben transformarse a **MobileStackView**
     (cada fila → tarjeta apilable con campos etiquetados).
1. **Validación de contrato previo a la generación:**
   - Antes de instanciar un componente, verificar que el endpoint REST expone
     todos los campos definidos en el contrato de datos (`props` de la tabla superior).
   - Si faltan campos, abortar la renderización y registrar advertencia.