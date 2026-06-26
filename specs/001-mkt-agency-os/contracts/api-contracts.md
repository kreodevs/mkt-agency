# Contratos de API - AgenteIA

> **Versión de documento:** 1.0  
> **Proyecto:** AgenteIA - Plataforma de Marketing Digital con IA  
> **Audiencia:** Desarrolladores frontend y backend, arquitectos  
> **Patrones activos (SSOT):** Arquitectura Hexagonal, Monolito Modular, CQRS, Adapter, Facade, Command, Observer/Pub-Sub, State, Strategy, Repository, Outbox Pattern, Event Sourcing.

---

## 1. Definición de Endpoints

Todas las rutas usan el prefijo `/api/v1/`. La autenticación es mediante **JWT (Bearer token)** salvo donde se indique "No". Los tokens se obtienen vía `POST /api/v1/auth/login`. El access token **nunca se persiste** en base de datos. Los refresh tokens se almacenan como hash SHA-256 en la tabla `sessions`.

Los endpoints se agrupan por módulo de negocio. Cada grupo incluye el módulo NestJS responsable y los patrones aplicados.

---

### 1.1 Setup y Health

| Método | Ruta                   | Descripción                                      | Auth | Notas                                                                                           |
| :----- | :--------------------- | :----------------------------------------------- | :--- | :---------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/health`       | Health check del servicio                        | No   | Verifica DB, Redis, S3. Retorna 503 si algún servicio crítico falla.                            |
| GET    | `/api/v1/setup/status` | Verificar si existe superadmin (primer arranque) | No   | Retorna `isConfigured: boolean`.                                                                |
| POST   | `/api/v1/setup/init`   | Crear primer superadmin (bootstrap)              | No   | Solo disponible si no existe superadmin. Crea usuario con `is_superadmin=true, tenant_id=null`. |
**Patrones:** Facade (SetupModule expone interfaz simplificada para bootstrap).

---

### 1.2 Autenticación (AuthModule)

| Método | Ruta                   | Descripción                                     | Auth | Notas                                                                 |
| :----- | :--------------------- | :---------------------------------------------- | :--- | :-------------------------------------------------------------------- |
| GET    | `/api/v1/auth/jwks`    | Obtener claves públicas JWKS para verificar JWT | No   | Endpoint público para que los clientes verifiquen la firma RS256.     |
| POST   | `/api/v1/auth/login`   | Iniciar sesión (email + password)               | No   | Rate limit 100 req/min/IP. Bloqueo tras 5 intentos fallidos (15 min). |
| POST   | `/api/v1/auth/refresh` | Renovar token de acceso                         | No   | Rota refresh token. Detecta reutilización y fuerza logout global.     |
| POST   | `/api/v1/auth/logout`  | Cerrar sesión                                   | JWT  | Invalida refresh token en DB.                                         |
**Patrones:** Command (LoginCommand, RefreshCommand), State (sesión activa/bloqueada/expirada).

---

### 1.3 Usuarios (UsersModule)

| Método | Ruta               | Descripción                            | Auth | Notas                                                         |
| :----- | :----------------- | :------------------------------------- | :--- | :------------------------------------------------------------ |
| GET    | `/api/v1/users/me` | Obtener perfil del usuario autenticado | JWT  | Incluye datos del tenant.                                     |
| PATCH  | `/api/v1/users/me` | Actualizar perfil del usuario          | JWT  | No permite cambiar rol ni email (para eso se usa superadmin). |
**Patrones:** Repository (UserRepository), CQRS (comando PATCH vs query GET).

---

### 1.4 Tenants y Superadmin (TenantModule, SuperadminModule)

| Método | Ruta                             | Descripción                         | Auth   | Notas                                                             |
| :----- | :------------------------------- | :---------------------------------- | :----- | :---------------------------------------------------------------- |
| POST   | `/api/v1/tenants`                | Crear tenant (superadmin)           | JWT+SA | Genera tenant y usuario owner asociado.                           |
| GET    | `/api/v1/tenants`                | Listar tenants (superadmin)         | JWT+SA | Paginación. Filtros opcionales: status, plan.                     |
| GET    | `/api/v1/tenants/:id`            | Obtener tenant por ID               | JWT+SA | Incluye configuración y límites.                                  |
| PATCH  | `/api/v1/tenants/:id`            | Actualizar tenant                   | JWT+SA | Modifica plan, límites, settings.                                 |
| DELETE | `/api/v1/tenants/:id`            | Eliminar tenant (superadmin)        | JWT+SA | Protege último superadmin. Elimina en cascada.                    |
| POST   | `/api/v1/superadmin/impersonate` | Iniciar impersonalización de tenant | JWT+SA | Genera token temporal (1 hora). Registra en `impersonation_logs`. |
| DELETE | `/api/v1/superadmin/impersonate` | Finalizar impersonalización         | JWT+SA | Restaura token original del superadmin.                           |
**Patrones:** Command (CreateTenantCommand, ImpersonateCommand), Repository (TenantRepository), Adapter (adaptación a diferentes planes).

---

### 1.5 Perfil de Empresa (CompanyProfileModule)

| Método | Ruta                                            | Descripción                                     | Auth | Notas                                           |
| :----- | :---------------------------------------------- | :---------------------------------------------- | :--- | :---------------------------------------------- |
| GET    | `/api/v1/company-profile`                       | Obtener perfil de empresa del tenant            | JWT  | Incluye `completionPercentage`.                 |
| PATCH  | `/api/v1/company-profile`                       | Actualizar perfil de empresa                    | JWT  | Actualiza campos y recalcula porcentaje.        |
| GET    | `/api/v1/company-profile/sections`              | Listar secciones del cuestionario de onboarding | JWT  | Incluye estado de cada sección (`isCompleted`). |
| PATCH  | `/api/v1/company-profile/sections/:key`         | Actualizar una sección del cuestionario         | JWT  | Marca sección como completada si corresponde.   |
| POST   | `/api/v1/company-profile/sections/:key/suggest` | Solicitar sugerencia IA para una sección        | JWT  | Asíncrono. Retorna `assignmentId` para polling. |
**Patrones:** State (perfil en progreso/completado), Strategy (sugerencias según sección), Command (UpdateSectionCommand, SuggestSectionCommand).

---

### 1.6 Plantillas de Campaña (CampaignModule)

| Método | Ruta                             | Descripción                  | Auth | Notas                                              |
| :----- | :------------------------------- | :--------------------------- | :--- | :------------------------------------------------- |
| GET    | `/api/v1/campaign-templates`     | Listar plantillas de campaña | JWT  | Incluye predefinidas y propias del tenant.         |
| POST   | `/api/v1/campaign-templates`     | Crear plantilla de campaña   | JWT  | Basada en agent_config y budget_distribution.      |
| GET    | `/api/v1/campaign-templates/:id` | Obtener plantilla            | JWT  |                                                    |
| PATCH  | `/api/v1/campaign-templates/:id` | Actualizar plantilla         | JWT  | No afecta campañas existentes.                     |
| DELETE | `/api/v1/campaign-templates/:id` | Eliminar plantilla           | JWT  | Solo si no está referenciada por campañas activas. |
**Patrones:** Repository (CampaignTemplateRepository), Command (CreateTemplateCommand).

---

### 1.7 Campañas (CampaignModule)

| Método | Ruta                                      | Descripción                                        | Auth | Notas                                                 |
| :----- | :---------------------------------------- | :------------------------------------------------- | :--- | :---------------------------------------------------- |
| GET    | `/api/v1/campaigns`                       | Listar campañas del tenant                         | JWT  | Filtro por status, plataforma. Paginación.            |
| POST   | `/api/v1/campaigns`                       | Crear campaña                                      | JWT  | Puede basarse en plantilla (`templateId`).            |
| GET    | `/api/v1/campaigns/:id`                   | Obtener detalle de campaña                         | JWT  | Incluye estrategia, presupuestos, contenido asociado. |
| PATCH  | `/api/v1/campaigns/:id`                   | Actualizar campaña                                 | JWT  |                                                       |
| DELETE | `/api/v1/campaigns/:id`                   | Eliminar campaña (solo draft)                      | JWT  | 409 si no está en draft.                              |
| POST   | `/api/v1/campaigns/:id/generate-strategy` | Solicitar a IA que genere estrategia y presupuesto | JWT  | Asíncrono. Retorna `assignmentId`. Worker BullMQ.     |
| GET    | `/api/v1/campaigns/:id/budgets`           | Listar presupuestos de campaña                     | JWT  |                                                       |
| PATCH  | `/api/v1/campaigns/:id/budgets/:budgetId` | Aprobar/rechazar presupuesto                       | JWT  | `approved: true/false`.                               |
**Patrones:** CQRS (CreateCampaignCommand vs GetCampaignsQuery), Command, State (campaign status machine), Repository.

---

### 1.8 Audiencias (AudienceModule)

| Método | Ruta                    | Descripción          | Auth | Notas                                                        |
| :----- | :---------------------- | :------------------- | :--- | :----------------------------------------------------------- |
| GET    | `/api/v1/audiences`     | Listar audiencias    | JWT  |                                                              |
| POST   | `/api/v1/audiences`     | Crear audiencia      | JWT  | `criteria` en JSONB.                                         |
| PATCH  | `/api/v1/audiences/:id` | Actualizar audiencia | JWT  | No permitido si `isImmutable=true` y tiene anuncios activos. |
| DELETE | `/api/v1/audiences/:id` | Eliminar audiencia   | JWT  | 409 si tiene anuncios activos.                               |
**Patrones:** Repository, Command.

---

### 1.9 Calendario Editorial (CalendarModule)

| Método | Ruta                     | Descripción                  | Auth | Notas                                                                        |
| :----- | :----------------------- | :--------------------------- | :--- | :--------------------------------------------------------------------------- |
| GET    | `/api/v1/calendar`       | Obtener Calendario Editorial | JWT  | Query params: `month`, `year`. Retorna días con recuento de piezas y estado. |
| GET    | `/api/v1/calendar/:date` | Obtener Detalle del Día      | JWT  | Fecha en formato ISO (YYYY-MM-DD). Lista piezas programadas.                 |
**Patrones:** Query (GetCalendarQuery, GetDayDetailQuery), Facade (calendar unifica contenidos, posts, ads, props).

---

### 1.10 Contenido, Versiones y Aprobaciones (ContentModule)

| Método | Ruta                                                 | Descripción                                     | Auth | Notas                                                           |
| :----- | :--------------------------------------------------- | :---------------------------------------------- | :--- | :-------------------------------------------------------------- |
| GET    | `/api/v1/contents`                                   | Listar contenidos de campaña                    | JWT  | Filtro por `campaignId`, `type`, `status`.                      |
| POST   | `/api/v1/contents`                                   | Crear contenido (borrador)                      | JWT  |                                                                 |
| GET    | `/api/v1/contents/:id`                               | Obtener contenido                               | JWT  | Incluye versión actual.                                         |
| PATCH  | `/api/v1/contents/:id`                               | Actualizar contenido (crea nueva versión)       | JWT  | Si está aprobado, crea nueva versión e invalida firma.          |
| DELETE | `/api/v1/contents/:id`                               | Eliminar contenido                              | JWT  | Solo si no tiene versiones aprobadas.                           |
| GET    | `/api/v1/contents/:id/versions`                      | Listar historial de versiones                   | JWT  | Ordenado por `versionNumber` descendente.                       |
| GET    | `/api/v1/contents/:id/versions/:vid`                 | Obtener versión específica                      | JWT  |                                                                 |
| POST   | `/api/v1/contents/:id/versions/:vid/approve`         | Aprobar versión con firma digital (Kill Switch) | JWT  | Calcula SHA-256(body + "                                        |
| POST   | `/api/v1/contents/:id/versions/:vid/reject`          | Rechazar versión                                | JWT  |                                                                 |
| POST   | `/api/v1/contents/:id/versions/:vid/request-changes` | Solicitar cambios sobre una versión             | JWT  | Crea nueva versión en borrador.                                 |
| POST   | `/api/v1/contents/:id/revert/:vid`                   | Revertir a una versión anterior                 | JWT  | Crea nueva versión con el contenido de la versión especificada. |
**Patrones:** Event Sourcing (cada modificación es un evento), Command (ApproveContentCommand, RejectContentCommand), State (content status), Repository (ContentRepository), Outbox (evento ContentApproved).

---

### 1.11 Anuncios (AdModule)

| Método | Ruta                         | Descripción                | Auth | Notas                                     |
| :----- | :--------------------------- | :------------------------- | :--- | :---------------------------------------- |
| GET    | `/api/v1/ads`                | Listar anuncios de campaña | JWT  | Filtro por `campaignId`, `platform`.      |
| POST   | `/api/v1/ads`                | Crear anuncio              | JWT  | Asocia `contentVersionId` y `budgetId`.   |
| PATCH  | `/api/v1/ads/:id`            | Actualizar anuncio         | JWT  |                                           |
| POST   | `/api/v1/ads/:id/mark-ready` | Marcar anuncio como listo  | JWT  | Solo si contenido asociado está aprobado. |
**Patrones:** Command, Repository.

---

### 1.12 Posts (PostModule)

| Método | Ruta                | Descripción              | Auth | Notas                                          |
| :----- | :------------------ | :----------------------- | :--- | :--------------------------------------------- |
| GET    | `/api/v1/posts`     | Listar posts programados | JWT  | Filtro por `campaignId`, `platform`, `status`. |
| POST   | `/api/v1/posts`     | Crear post               | JWT  |                                                |
| PATCH  | `/api/v1/posts/:id` | Actualizar post          | JWT  |                                                |
**Patrones:** Command, Repository.

---

### 1.13 Leads (CRMLeadModule)

| Método | Ruta                             | Descripción                        | Auth | Notas                                              |
| :----- | :------------------------------- | :--------------------------------- | :--- | :------------------------------------------------- |
| GET    | `/api/v1/leads`                  | Listar leads del pipeline CRM      | JWT  | Filtro por `stage`, `score`, `formId`. Paginación. |
| GET    | `/api/v1/leads/:id`              | Obtener detalle de lead            | JWT  | Incluye interacciones recientes y score.           |
| PATCH  | `/api/v1/leads/:id/stage`        | Avanzar/retroceder etapa del lead  | JWT  | Registra interacción automática.                   |
| PATCH  | `/api/v1/leads/:id`              | Actualizar datos del lead          | JWT  |                                                    |
| DELETE | `/api/v1/leads/:id`              | Eliminar lead                      | JWT  | 409 si tiene propuestas firmadas asociadas.        |
| GET    | `/api/v1/leads/:id/interactions` | Obtener historial de interacciones | JWT  | Append-only.                                       |
**Patrones:** State (lead stages), Strategy (scoring IA), Command (ChangeLeadStageCommand), Repository.

---

### 1.14 Formularios (FormModule)

| Método | Ruta                            | Descripción                       | Auth | Notas                                                 |
| :----- | :------------------------------ | :-------------------------------- | :--- | :---------------------------------------------------- |
| GET    | `/api/v1/forms`                 | Listar formularios del tenant     | JWT  |                                                       |
| POST   | `/api/v1/forms`                 | Crear formulario                  | JWT  | Define `fields` (JSONB), `style` (JSONB).             |
| GET    | `/api/v1/forms/:id`             | Obtener formulario                | JWT  |                                                       |
| PATCH  | `/api/v1/forms/:id`             | Actualizar formulario             | JWT  |                                                       |
| DELETE | `/api/v1/forms/:id`             | Eliminar formulario               | JWT  |                                                       |
| GET    | `/api/v1/forms/:id/snippet`     | Obtener snippet JS del formulario | JWT  | HTML/JS embebible.                                    |
| POST   | `/api/v1/forms/:id/submit`      | Enviar formulario (público)       | No   | Crea lead automáticamente. Rate limit 100 req/min/IP. |
| GET    | `/api/v1/forms/:id/submissions` | Listar envíos de formulario       | JWT  |                                                       |
**Patrones:** Command, Repository.

---

### 1.15 Activos Multimedia (AssetModule)

| Método | Ruta                              | Descripción                        | Auth | Notas                                                                               |
| :----- | :-------------------------------- | :--------------------------------- | :--- | :---------------------------------------------------------------------------------- |
| GET    | `/api/v1/assets`                  | Listar activos multimedia          | JWT  | Filtro por `folderId`, `tagIds`, `type`. Paginación.                                |
| POST   | `/api/v1/assets/upload`           | Subir activo (multipart/form-data) | JWT  | Retorna metadatos. Almacena en S3 con key única.                                    |
| GET    | `/api/v1/assets/:id`              | Obtener metadatos de activo        | JWT  |                                                                                     |
| PATCH  | `/api/v1/assets/:id`              | Actualizar metadatos               | JWT  | Renombrar, mover carpeta, cambiar etiquetas.                                        |
| DELETE | `/api/v1/assets/:id`              | Eliminar activo                    | JWT  | 409 si `referenceCount > 0` o `isInUse = true`.                                     |
| GET    | `/api/v1/assets/:id/download-url` | Obtener URL firmada de descarga    | JWT  | Expira en 1 hora.                                                                   |
| POST   | `/api/v1/assets/:id/duplicate`    | Duplicar activo                    | JWT  | Crea nuevo registro apuntando al mismo archivo físico. Incrementa `referenceCount`. |
| GET    | `/api/v1/asset-folders`           | Listar carpetas                    | JWT  | Árbol jerárquico con `parentId`.                                                    |
| POST   | `/api/v1/asset-folders`           | Crear carpeta                      | JWT  |                                                                                     |
| PATCH  | `/api/v1/asset-folders/:id`       | Renombrar/mover carpeta            | JWT  |                                                                                     |
| DELETE | `/api/v1/asset-folders/:id`       | Eliminar carpeta                   | JWT  | 409 si contiene activos o subcarpetas.                                              |
**Patrones:** Adapter (S3Adapter), Repository (AssetRepository), Command.

---

### 1.16 Competidores (CompetitorModule)

| Método | Ruta                               | Descripción                     | Auth | Notas                               |
| :----- | :--------------------------------- | :------------------------------ | :--- | :---------------------------------- |
| GET    | `/api/v1/competitors`              | Listar competidores             | JWT  |                                     |
| POST   | `/api/v1/competitors`              | Registrar competidor            | JWT  |                                     |
| DELETE | `/api/v1/competitors/:id`          | Eliminar competidor             | JWT  |                                     |
| GET    | `/api/v1/competitors/:id/mentions` | Obtener menciones de competidor | JWT  | Paginación. Filtro por sentimiento. |
**Patrones:** Repository, Command.

---

### 1.17 Agentes IA (AIAgentModule)

| Método | Ruta                        | Descripción                           | Auth   | Notas                                          |
| :----- | :-------------------------- | :------------------------------------ | :----- | :--------------------------------------------- |
| GET    | `/api/v1/ai-agents`         | Listar agentes de IA configurados     | JWT    | Incluye `modelConfig`.                         |
| PATCH  | `/api/v1/ai-agents/:id`     | Actualizar configuración de agente IA | JWT+SA | Solo superadmin.                               |
| GET    | `/api/v1/agent-assignments` | Listar asignaciones de agentes        | JWT    | Filtro por `campaignId`, `taskType`, `status`. |
**Patrones:** Facade (IAOrchestrator), Command (AssignAgentCommand), Observer (resultado de asignación vía outbox).

---

### 1.18 Propuestas (ProposalModule)

| Método | Ruta                           | Descripción                        | Auth | Notas                              |
| :----- | :----------------------------- | :--------------------------------- | :--- | :--------------------------------- |
| POST   | `/api/v1/proposals`            | Solicitar propuesta comercial (IA) | JWT  | Asíncrona. Retorna `assignmentId`. |
| GET    | `/api/v1/proposals`            | Listar propuestas                  | JWT  | Filtro por `campaignId`, `status`. |
| GET    | `/api/v1/proposals/:id`        | Obtener propuesta                  | JWT  | Incluye contenido completo.        |
| POST   | `/api/v1/proposals/:id/sign`   | Firmar propuesta digitalmente      | JWT  | Calcula hash y congela.            |
| POST   | `/api/v1/proposals/:id/reject` | Rechazar propuesta                 | JWT  |                                    |
**Patrones:** Command (CreateProposalCommand, SignProposalCommand), State.

---

### 1.19 Reportes (ReportModule)

| Método | Ruta                  | Descripción                          | Auth | Notas                            |
| :----- | :-------------------- | :----------------------------------- | :--- | :------------------------------- |
| GET    | `/api/v1/reports`     | Listar reportes                      | JWT  | Filtro por `type`, `campaignId`. |
| POST   | `/api/v1/reports`     | Solicitar generación de reporte (IA) | JWT  | Asíncrona.                       |
| GET    | `/api/v1/reports/:id` | Obtener reporte                      | JWT  | Incluye `data` JSONB.            |
**Patrones:** Command, Repository.

---

### 1.20 Dominios Personalizados (DomainModule)

| Método | Ruta                             | Descripción                      | Auth | Notas                                       |
| :----- | :------------------------------- | :------------------------------- | :--- | :------------------------------------------ |
| POST   | `/api/v1/domains`                | Configurar dominio personalizado | JWT  | Genera `verificationToken` y `cnameValue`.  |
| GET    | `/api/v1/domains`                | Listar dominios del tenant       | JWT  |                                             |
| GET    | `/api/v1/domains/:id`            | Obtener estado del dominio       | JWT  | Incluye `verificationStatus` y `sslStatus`. |
| DELETE | `/api/v1/domains/:id`            | Eliminar dominio                 | JWT  | Solo si no es el dominio principal.         |
| POST   | `/api/v1/domains/:id/verify-dns` | Verificar registro DNS           | JWT  | Comprueba CNAME y token. Actualiza estado.  |
**Patrones:** Adapter (DNSAdapter), Command, State (verificationStatus machine).

---

### 1.21 Páginas Locales SEO (LocalPageModule)

| Método | Ruta                      | Descripción                | Auth | Notas                  |
| :----- | :------------------------ | :------------------------- | :--- | :--------------------- |
| GET    | `/api/v1/local-pages`     | Listar páginas locales SEO | JWT  |                        |
| POST   | `/api/v1/local-pages`     | Crear página local         | JWT  | Slug único por tenant. |
| PATCH  | `/api/v1/local-pages/:id` | Actualizar página local    | JWT  |                        |
| DELETE | `/api/v1/local-pages/:id` | Eliminar página local      | JWT  |                        |
**Patrones:** Repository, Command.

---

### 1.22 Auditoría, Seguridad y Admin (AuditModule, SecurityModule, AdminModule)

| Método | Ruta                                | Descripción                                             | Auth   | Notas                                                    |
| :----- | :---------------------------------- | :------------------------------------------------------ | :----- | :------------------------------------------------------- |
| GET    | `/api/v1/audit-logs`                | Listar logs de auditoría (superadmin)                   | JWT+SA | Paginación. Filtros: `tenantId`, `action`, `from`, `to`. |
| GET    | `/api/v1/security-events`           | Listar eventos de seguridad (superadmin)                | JWT+SA | Paginación. Filtros: `severity`, `eventType`.            |
| POST   | `/api/v1/admin/sessions/invalidate` | Invalidar todas las sesiones de un usuario (superadmin) | JWT+SA | Requiere `userId` en body.                               |
**Patrones:** Repository (audit_logs y security_events son append-only), Command (InvalidateSessionsCommand).

---

## 2. Esquemas de Request y Response

A continuación se presentan ejemplos JSON representativos de los endpoints principales. Los tipos están alineados con el modelo de datos (UUID, fechas ISO 8601, JSONB).

### 2.1 Health Check

**Request:** `GET /api/v1/health`

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "s3": "reachable"
  }
}
```

**Response 503:**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": "connected",
    "redis": "disconnected",
    "s3": "reachable"
  }

```

---

```
### 2.2 Setup Init
```

**Request:** `POST /api/v1/setup/init`

```json
{
  "email": "admin@agenteia.com",
  "password": "Str0ngP@ssw0rd!",
  "name": "Super Admin"
}
```

**Response 201:**
```json
{
  "id": "a1b2c3d4-...",
  "email": "admin@agenteia.com",
  "name": "Super Admin",
  "isSuperadmin": true
}
```

**Response 409:**
```json
{
  "error": "Superadmin already exists",
  "code": "CONFLICT"

```

---

```
### 2.3 Login
```

**Request:** `POST /api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "myPassword123"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 900,
  "user": {
    "id": "b2c3d4e5-...",
    "email": "user@example.com",
    "name": "User Name",
    "tenantId": "c3d4e5f6-...",
    "isSuperadmin": false,
    "role": "owner"
  }
}
```

**Response 401:**
```json
{
  "error": "Invalid credentials",
  "code": "UNAUTHORIZED"
}
```

**Response 429 (bloqueo):**
```json
{
  "error": "Account locked due to multiple failed attempts. Try again in 15 minutes.",
  "code": "ACCOUNT_LOCKED",
  "lockedUntil": "2025-01-15T10:45:00Z"

```

---

```
### 2.4 Refresh Token
```

**Request:** `POST /api/v1/auth/refresh`

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 900
}
```

**Response 409 (reutilización):**
```json
{
  "error": "Refresh token already used. All sessions invalidated for security.",
  "code": "TOKEN_REUSE_DETECTED"

```

---

```
### 2.5 Crear Campaña
```

**Request:** `POST /api/v1/campaigns`

```json
{
  "name": "Campaña Verano 2025",
  "objective": "Incrementar ventas de línea playera en un 20%",
  "templateId": "d4e5f6a7-...",
  "platforms": ["facebook", "instagram"],
  "totalBudget": 5000.00
}
```

**Response 201:**
```json
{
  "id": "e5f6a7b8-...",
  "name": "Campaña Verano 2025",
  "objective": "Incrementar ventas de línea playera en un 20%",
  "status": "draft",
  "totalBudget": 5000.00,
  "platforms": ["facebook", "instagram"],
  "strategy": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"

```

---

```
### 2.6 Generar Estrategia
```

**Request:** `POST /api/v1/campaigns/:id/generate-strategy`

**Response 202:**
```json
{
  "assignmentId": "f6a7b8c9-...",
  "status": "processing",
  "message": "Strategy generation in progress."

```

---

```
### 2.7 Aprobar Contenido (Kill Switch)
```

**Request:** `POST /api/v1/contents/:id/versions/:vid/approve`

```json
{
  "feedback": "Aprobado, excelente trabajo"
}
```

**Response 200:**
```json
{
  "contentId": "a1b2c3d4-...",
  "versionId": "b2c3d4e5-...",
  "versionNumber": 3,
  "status": "approved",
  "signatureHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signedAt": "2025-01-15T10:30:00Z",
  "message": "Content approved and frozen."
}
```

**Response 409:**
```json
{
  "error": "Content version is already approved.",
  "code": "ALREADY_APPROVED"

```

---

```
### 2.8 Enviar Formulario (Público)
```

**Request:** `POST /api/v1/forms/:id/submit`

```json
{
  "email": "visitor@example.com",
  "name": "Juan Pérez",
  "phone": "+521234567890",
  "company": "Mi PYME",
  "message": "Me interesa saber más..."
}
```

**Response 201:**
```json
{
  "submissionId": "c3d4e5f6-...",
  "message": "Form submitted successfully."

```

---

```
### 2.9 Subir Asset
```

**Request:** `POST /api/v1/assets/upload` (multipart/form-data)
- Campo `file`: archivo binario
- Campo `folderId` (opcional): UUID
- Campo `tags[]` (opcional): array de nombres de etiquetas

**Response 201:**
```json
{
  "id": "d4e5f6a7-...",
  "name": "logo-empresa.png",
  "type": "image",
  "mimeType": "image/png",
  "fileKey": "tenants/c3d4e5f6/logo-empresa.png",
  "fileSize": 245760,
  "url": "https://cdn.agenteia.com/tenants/c3d4e5f6/logo-empresa.png",
  "folderId": null,
  "tags": ["logo", "brand"],
  "referenceCount": 0,
  "isInUse": false,
  "createdAt": "2025-01-15T10:30:00Z"

```

---

```
### 2.10 Impersonalizar
```

**Request:** `POST /api/v1/superadmin/impersonate`

```json
{
  "tenantId": "e5f6a7b8-...",
  "userId": "f6a7b8c9-..."
}
```

**Response 200:**
```json
{
  "impersonationToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "tenant": {
    "id": "e5f6a7b8-...",
    "name": "Cliente S.A."
  },
  "user": {
    "id": "f6a7b8c9-...",
    "name": "Cliente Name",
    "email": "cliente@example.com"
  },
  "note": "All actions are logged. Destructive actions are prohibited."
}
```

**Response 200 (finalizar):**
```json
{
  "message": "Impersonation ended. Audit log recorded.",
  "sessionToken": "eyJhbGciOiJSUzI1NiIs..."

```

---

```
### 2.11 Listar Leads con Paginación
```

**Request:** `GET /api/v1/leads?stage=prospect&page=1&limit=20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "email": "lead@example.com",
      "name": "María García",
      "phone": "+525512345678",
      "company": "Tech Solutions",
      "score": 75,
      "stage": "prospect",
      "metadata": {},
      "createdAt": "2025-01-14T09:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }

  ],
  "total": 150,
  "page": 1,
  "limit": 20

```

---

## 3. Códigos de Error HTTP

Los siguientes códigos se aplican de forma consistente en toda la API. Cada error retorna un objeto JSON con `error` (mensaje legible) y `code` (código técnico para el frontend).

| Código | Significado en contexto                                                        | Ejemplo de uso                                       | Response                                                                                               |
| :----- | :----------------------------------------------------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| 400    | Error de validación (payload inválido, campos faltantes, violación de formato) | Enviar email inválido en login                       | `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "details": [...] }`                       |
| 401    | No autenticado (token ausente, expirado o inválido)                            | Token JWT expirado                                   | `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }`                                                  |
| 403    | No autorizado (rol insuficiente para la acción)                                | Usuario tenant intenta crear tenant                  | `{ "error": "Forbidden", "code": "FORBIDDEN" }`                                                        |
| 404    | Recurso no encontrado                                                          | ID de campaña inexistente                            | `{ "error": "Campaign not found", "code": "NOT_FOUND" }`                                               |
| 409    | Conflicto de estado (recurso en estado no permitido)                           | Aprobar contenido ya aprobado, eliminar asset en uso | `{ "error": "Content version is already approved", "code": "ALREADY_APPROVED" }`                       |
| 413    | Payload demasiado grande (archivo excede límite)                               | Subir imagen de 200MB                                | `{ "error": "File size exceeds limit", "code": "PAYLOAD_TOO_LARGE", "maxSize": 52428800 }`             |
| 422    | Error semántico en los datos (ej. presupuesto diario > total)                  | Presupuesto diario mayor que el total de campaña     | `{ "error": "Daily budget exceeds total budget", "code": "UNPROCESSABLE_ENTITY" }`                     |
| 429    | Rate limit excedido o cuenta bloqueada                                         | Más de 100 req/min desde una IP en login             | `{ "error": "Too many requests. Try again in 60 seconds.", "code": "RATE_LIMITED", "retryAfter": 60 }` |
| 500    | Error interno del servidor (no esperado)                                       | Excepción no controlada                              | `{ "error": "Internal server error", "code": "INTERNAL_ERROR" }`                                       |
| 503    | Servicio no disponible (dependencia caída)                                     | Redis o BD no responde                               | `{ "error": "Service temporarily unavailable", "code": "SERVICE_UNAVAILABLE" }`                        |
**Política de rate limiting por endpoint:**
- Endpoints públicos (login, setup, health, form submit): 100 req/min por IP.
- Endpoints autenticados (JWT): 1000 req/min por usuario.
- Endpoints de IA (generate-strategy, suggest): 20 req/min por tenant.
- Endpoints de superadmin: 100 req/min por usuario.

La respuesta 429 incluye cabecera `Retry-After` con los segundos hasta el siguiente reintento permitido.

---

## 4. Tipado

Los contratos de API deben coincidir exactamente con los esquemas **Zod** y **TypeScript** definidos en el backend (NestJS) y consumidos por el frontend (React). Cualquier desviación entre frontend y backend debe ser detectada en tiempo de compilación mediante la generación de tipos compartidos.

### 4.1 Lineamientos

- **UUID**: Todos los IDs son cadenas UUID v4 (formato `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`).
- **Fechas**: Siempre en formato ISO 8601 (`2025-01-15T10:30:00Z`), timezone UTC.
- **JSONB**: Los campos JSONB se serializan como objetos/arrays planos en el JSON de la API.
- **Timestamps**: `createdAt`, `updatedAt`, `signedAt` son string con formato ISO.
- **Números decimales**: Se usan como `number` en JSON (tipo `DECIMAL` en BD se serializa sin comillas).
- **Booleanos**: `true` / `false` (minúsculas, sin comillas).
- **Enums**: Se representan como strings (ej. `"draft"`, `"approved"`, `"rejected"`). No se usan números.

### 4.2 Relación con el modelo de datos (Prisma)

Todos los campos expuestos en la API deben corresponder a columnas definidas en las tablas del modelo de datos (§3 del MDD). No se exponen campos internos como `password_hash`, `refresh_token` (en texto plano), ni claves privadas.

Ejemplo de mapeo para `POST /api/v1/campaigns`:

| Campo API (JSON) | Columna DB     | Tipo DB       | Notas                              |
| :--------------- | :------------- | :------------ | :--------------------------------- |
| `name`           | `name`         | VARCHAR(255)  | Requerido                          |
| `objective`      | `objective`    | VARCHAR(500)  | Opcional                           |
| `templateId`     | `template_id`  | UUID          | Opcional (FK a campaign_templates) |
| `platforms`      | `platforms`    | JSONB         | Array de strings                   |
| `totalBudget`    | `total_budget` | DECIMAL(12,2) | Opcional en creación               |
El backend valida con **Zod** antes de llegar al comando. El frontend reutiliza el mismo esquema mediante paquetes compartidos (monorepo con `shared/`).

---

## 5. Cumplimiento con el MDD

El presente documento de Contratos de API se alinea estrictamente con la Constitución del proyecto (MDD) en los siguientes aspectos:

### Endpoints alineados
- Se han documentado **todos los endpoints** listados en la tabla resumen de la §4 del MDD, incluyendo las rutas de Setup, Auth, Tenants, Company Profile, Campaigns, Contents, Calendar, Leads, Forms, Assets, Competitors, AI Agents, Proposals, Reports, Domains, Local Pages, Audit y Admin.
- Cada endpoint ha sido mapeado al módulo NestJS correspondiente según el Blueprint.

### Esquemas coherentes con el modelo de datos
- Los tipos y campos expuestos en los ejemplos JSON corresponden a las columnas definidas en el SQL de §3 del MDD (UUID, TIMESTAMPTZ, JSONB, DECIMAL, VARCHAR, etc.).
- Se respetan las restricciones de inmutabilidad: tablas append-only (`audit_logs`, `security_events`, `events`, `lead_interactions`) no tienen endpoints de actualización/eliminación.
- Los campos `is_superadmin`, `role`, `status` se exponen como strings/booleanos directamente desde la DB.

### Patrones activos reflejados
- **Arquitectura Hexagonal**: Los endpoints son la interfaz REST de los puertos primarios. Los controladores se comunican con comandos/queries que son manejados por casos de uso.
- **CQRS**: Separación explícita entre comandos (POST, PATCH, DELETE) y queries (GET). Por ejemplo, `CreateCampaignCommand` vs `GetCampaignsQuery`.
- **Command**: Cada mutación (crear campaña, aprobar contenido, impersonar) se modela como comando.
- **Event Sourcing + Outbox**: Los endpoints de aprobación (`/approve`) generan eventos en la tabla `outbox` para notificaciones asíncronas.
- **State**: Los endpoints de contenido, leads y propuestas reflejan máquinas de estado (borrador → aprobado/rechazado, etc.).
- **Repository**: Todos los accesos a datos se hacen a través de interfaces de repositorio implementadas en infraestructura.

### Seguridad y reglas de negocio
- **Kill Switch**: El endpoint `POST /contents/:id/versions/:vid/approve` implementa la firma digital SHA-256 y congela el contenido. Sin este paso, ningún contenido se descarga.
- **Inmutabilidad post-firma**: `PATCH /contents/:id` sobre contenido aprobado crea una nueva versión automáticamente e invalida la firma.
- **Refresh token rotado**: `POST /auth/refresh` invalida el token anterior y emite uno nuevo; detecta reutilización.
- **Aislamiento multi-tenant**: Todos los endpoints autenticados filtran por `tenant_id` extraído del JWT.
- **Superadmin mínimo**: `DELETE /tenants/:id` y `DELETE /admin/sessions/invalidate` protegen contra eliminar el último superadmin.

### Notas de implementación
- Los endpoints marcados como **JWT+SA** requieren que el usuario tenga `is_superadmin = true` en sus claims.
- Los endpoints de IA (`generate-strategy`, `suggest`, `reports`) son **asíncronos**: retornan 202 con un `assignmentId`. El frontend debe hacer polling al endpoint de asignaciones o suscribirse a eventos vía WebSocket (futuro).
- Los endpoints públicos (`submit`, `health`, `setup`) tienen rate limits más restrictivos.
- Los endpoints de eliminación (`DELETE`) retornan 409 si el recurso está en un estado que impide la eliminación (asset en uso, versión aprobada, etc.).

---

## Registro de Cambios del Documento

| Versión | Fecha      | Descripción del cambio                                                                                                                                                                                     |
| :------ | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Junio 2025 | Creación inicial de los Contratos de API para AgenteIA, basado en MDD v1.0, Blueprint v1.0 y BRD v1.0. Cubre todos los endpoints de §4, ejemplos JSON, códigos de error y alineación con patrones activos. |