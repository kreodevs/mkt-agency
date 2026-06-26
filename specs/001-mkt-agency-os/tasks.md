# Tasks

## Backend tasks

### US-001: Crear primer superadmin (bootstrap)

- [x] [P] Implementar endpoint `GET /api/v1/setup/status` que verifique existencia de superadmin
  **MDD:** §4 GET /api/v1/setup/status
  **Story:** US-001
  **Archivo:** `apps/backend/src/modules/setup/setup.controller.ts`
  **Nota:** Query `SELECT COUNT(*) FROM users WHERE is_superadmin = TRUE`; respuesta `{ isConfigured: boolean }`

- [x] [P] Implementar endpoint `POST /api/v1/setup/init` para crear primer superadmin
  **MDD:** §4 POST /api/v1/setup/init
  **Story:** US-001
  **Archivo:** `apps/backend/src/modules/setup/setup.service.ts`
  **Nota:** Guard de verificación de inexistencia de superadmin; usa `CreateSuperadminCommand` con validación Argon2id

- [x] [P] Implementar guard de bootstrap que verifique que no exista superadmin previamente
  **MDD:** §4 setup/init
  **Story:** US-001
  **Archivo:** `apps/backend/src/modules/setup/guards/no-superadmin-exists.guard.ts`

- [x] [P] Crear comando `CreateSuperadminCommand` y su handler
  **MDD:** §5.1 regla 6, §6
  **Story:** US-001
  **Archivo:** `apps/backend/src/modules/setup/commands/create-superadmin.command.ts`

- [x] [P] Implementar lógica de dominio para validar contraseña con Argon2id
  **MDD:** §6
  **Archivo:** `apps/backend/src/shared/domain/password.value-object.ts`

**Checkpoint:** Probar que `GET /setup/status` devuelve `isConfigured: false` antes de init, y `true` después. `POST /setup/init` solo funciona una vez.

### US-002: Gestionar tenants (CRUD)

- [x] [P] Implementar endpoint `POST /api/v1/tenants` para crear tenant
  **MDD:** §4 POST /api/v1/tenants
  **Story:** US-002
  **Archivo:** `apps/backend/src/modules/tenant/tenant.controller.ts`

- [x] [P] Implementar endpoint `GET /api/v1/tenants` para listar tenants con paginación
  **MDD:** §4 GET /api/v1/tenants
  **Story:** US-002
  **Archivo:** `apps/backend/src/modules/tenant/tenant.controller.ts`

- [x] [P] Implementar endpoint `GET /api/v1/tenants/:id` para obtener detalle de tenant
  **MDD:** §4 GET /api/v1/tenants/:id
  **Story:** US-002
  **Archivo:** `apps/backend/src/modules/tenant/tenant.controller.ts`

- [x] [P] Implementar endpoint `PATCH /api/v1/tenants/:id` para actualizar tenant
  **MDD:** §4 PATCH /api/v1/tenants/:id
  **Story:** US-002
  **Archivo:** `apps/backend/src/modules/tenant/tenant.controller.ts`

- [x] [P] Implementar endpoint `DELETE /api/v1/tenants/:id` con regla de superadmin mínimo
  **MDD:** §4 DELETE /api/v1/tenants/:id, §5.1 regla 6
  **Story:** US-002
  **Archivo:** `apps/backend/src/modules/tenant/commands/delete-tenant.command.ts`
  **Nota:** Verificar que no se elimine el último superadmin

- [x] [P] Implementar repositorio `TenantRepository` con filtro por `tenant_id`
  **MDD:** §3 tabla tenants, §5.1 regla 5
  **Archivo:** `apps/backend/src/modules/tenant/domain/tenant.repository.ts`

- [x] [P] Crear migración TypeORM para tabla `tenants`
  **MDD:** §3.1 SQL `CREATE TABLE tenants`
  **Archivo:** `apps/backend/src/modules/tenant/infrastructure/typeorm/tenant.entity.ts`

- [x] [P] Implementar guard de rol superadmin para endpoints de tenant
  **MDD:** §6
  **Archivo:** `apps/backend/src/shared/guards/superadmin.guard.ts`

**Checkpoint:** Probar CRUD completo de tenants con autenticación superadmin; verificar que no se permite eliminar el último superadmin.

### US-003: Impersonar un tenant como superadmin

- [x] [P] Implementar endpoint `POST /api/v1/superadmin/impersonate` con token JWT temporal de 1 hora
  **MDD:** §4 POST /api/v1/superadmin/impersonate
  **Story:** US-003
  **Archivo:** `apps/backend/src/modules/superadmin/superadmin.controller.ts`

- [x] [P] Implementar endpoint `DELETE /api/v1/superadmin/impersonate` para finalizar impersonalización
  **MDD:** §4 DELETE /api/v1/superadmin/impersonate
  **Story:** US-003
  **Archivo:** `apps/backend/src/modules/superadmin/superadmin.controller.ts`

- [x] [P] Implementar lógica de dominio para crear token de impersonación con claims específicos
  **MDD:** §6, §5.5 (caso borde impersonación)
  **Story:** US-003
  **Archivo:** `apps/backend/src/modules/superadmin/commands/impersonate.command.ts`

- [x] [P] Implementar registro automático en `impersonation_logs` para cada acción durante impersonación
  **MDD:** §3 tabla impersonation_logs, §6
  **Story:** US-003
  **Archivo:** `apps/backend/src/modules/superadmin/services/impersonation-logger.service.ts`

- [x] [P] Implementar validación en dominio que prohíba acciones destructivas durante impersonación
  **MDD:** §5.5 (caso borde)
  **Story:** US-003
  **Archivo:** `apps/backend/src/modules/superadmin/domain/impersonation-policy.ts`

- [x] [P] Crear migración TypeORM para tabla `impersonation_logs`
  **MDD:** §3.1 SQL `CREATE TABLE impersonation_logs`
  **Archivo:** `apps/backend/src/modules/superadmin/infrastructure/typeorm/impersonation-log.entity.ts`

**Checkpoint:** Superadmin puede impersonar y ver banner; las acciones quedan registradas en logs; acciones destructivas son bloqueadas.

### US-004: Iniciar sesión y gestionar tokens

- [x] [P] Implementar endpoint `POST /api/v1/auth/login` con verificación Argon2id y bloqueo de cuenta
  **MDD:** §4 POST /api/v1/auth/login, §5.1 regla 4, §5.3 flujo
  **Story:** US-004
  **Archivo:** `apps/backend/src/modules/auth/auth.controller.ts`

- [x] [P] Implementar endpoint `POST /api/v1/auth/refresh` con rotación de refresh token
  **MDD:** §4 POST /api/v1/auth/refresh, §5.1 regla 3, §5.5 (caso borde reutilización)
  **Story:** US-004
  **Archivo:** `apps/backend/src/modules/auth/auth.controller.ts`

- [x] [P] Implementar endpoint `POST /api/v1/auth/logout` para invalidar sesión
  **MDD:** §4 POST /api/v1/auth/logout
  **Story:** US-004
  **Archivo:** `apps/backend/src/modules/auth/auth.controller.ts`

- [x] [P] Implementar endpoint `GET /api/v1/auth/jwks` para exponer claves públicas RS256
  **MDD:** §4 GET /api/v1/auth/jwks
  **Story:** US-004
  **Archivo:** `apps/backend/src/modules/auth/auth.controller.ts`

- [x] [P] Implementar lógica de dominio para login con conteo de intentos y bloqueo
  **MDD:** §5.1 regla 4, §5.3 flujo
  **Story:** US-004
  **Archivo:** `apps/backend/src/modules/auth/commands/login.command.ts`

- [x] [P] Implementar lógica de rotación de refresh token y detección de reutilización
  **MDD:** §5.1 regla 3, §5.5 (caso borde)
  **Story:** US-004, T-001
  **Archivo:** `apps/backend/src/modules/auth/commands/refresh-token.command.ts`

- [x] [P] Implementar repositorio de sesiones con hash SHA-256 de refresh token
  **MDD:** §6, §3 tabla sessions
  **Archivo:** `apps/backend/src/modules/auth/domain/session.repository.ts`

- [x] [P] Crear migración TypeORM para tabla `sessions`
  **MDD:** §3.1 SQL `CREATE TABLE sessions`
  **Archivo:** `apps/backend/src/modules/auth/infrastructure/typeorm/session.entity.ts`

- [x] [P] Implementar servicio JWT con RS256 (generación y verificación)
  **MDD:** §6
  **Archivo:** `apps/backend/src/modules/auth/services/jwt.service.ts`

- [x] [P] Registro de eventos de seguridad (`security_events`) en login fallido, bloqueo, reutilización de token
  **MDD:** §6, §5.5
  **Story:** US-004, US-006
  **Archivo:** `apps/backend/src/modules/security/services/security-event-recorder.service.ts`

**Checkpoint:** Login exitoso devuelve JWT; tras 5 fallos, bloqueo de 15 minutos; refresh token se rota y detección de reuso invalida todas las sesiones.

### US-005: Ver y actualizar perfil de usuario

- [x] [P] Implementar endpoint `GET /api/v1/users/me` para obtener perfil del usuario autenticado
  **MDD:** §4 GET /api/v1/users/me
  **Story:** US-005
  **Archivo:** `apps/backend/src/modules/users/users.controller.ts`

- [x] [P] Implementar endpoint `PATCH /api/v1/users/me` para actualizar nombre/email
  **MDD:** §4 PATCH /api/v1/users/me
  **Story:** US-005
  **Archivo:** `apps/backend/src/modules/users/users.controller.ts`

- [x] [P] Implementar validación de unicidad de email y registro en audit_logs
  **MDD:** §6
  **Story:** US-005
  **Archivo:** `apps/backend/src/modules/users/commands/update-user.command.ts`

**Checkpoint:** Usuario puede ver y actualizar su perfil; cambios quedan en audit_logs.

### US-006: Visualizar y gestionar eventos de seguridad (superadmin)

- [x] [P] Implementar endpoint `GET /api/v1/security-events` con filtros y paginación
  **MDD:** §4 GET /api/v1/security-events
  **Story:** US-006
  **Archivo:** `apps/backend/src/modules/security/security.controller.ts`

- [x] [P] Crear migración TypeORM para tabla `security_events`
  **MDD:** §3.1 SQL `CREATE TABLE security_events`
  **Archivo:** `apps/backend/src/modules/security/infrastructure/typeorm/security-event.entity.ts`

- [x] [P] Implementar guard de superadmin para endpoints de seguridad
  **MDD:** §6
  **Archivo:** `apps/backend/src/modules/security/guards/security-superadmin.guard.ts`

**Checkpoint:** Superadmin puede listar eventos de seguridad con filtros.

### US-007: Completar onboarding progresivo del perfil de empresa

- [x] [P] Implementar endpoint `GET /api/v1/company-profile` para obtener perfil
  **MDD:** §4 GET /api/v1/company-profile
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/company-profile.controller.ts`

- [x] [P] Implementar endpoint `PATCH /api/v1/company-profile` para actualizar perfil
  **MDD:** §4 PATCH /api/v1/company-profile
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/company-profile.controller.ts`

- [x] [P] Implementar endpoint `GET /api/v1/company-profile/sections` para listar secciones del cuestionario
  **MDD:** §4 GET /api/v1/company-profile/sections
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/company-profile.controller.ts`

- [x] [P] Implementar endpoint `PATCH /api/v1/company-profile/sections/:key` para guardar sección
  **MDD:** §4 PATCH /api/v1/company-profile/sections/:key
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/company-profile.controller.ts`

- [x] [P] Implementar lógica de cálculo de `completion_percentage` y activación al 80%
  **MDD:** §5.1 regla 8, §5.5 flujo onboarding
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/services/completion-calculator.service.ts`

- [x] [P] Emitir evento `CompanyProfileCompletedEvent` vía outbox al alcanzar 80%
  **MDD:** §2.3, §5.5
  **Story:** US-007
  **Archivo:** `apps/backend/src/modules/company-profile/events/company-profile-completed.event.ts`

- [ ] [P] Crear migraciones para tablas `company_profiles` y `company_profile_sections`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/company-profile/infrastructure/typeorm/`
  **Nota:** Entidades TypeORM + `synchronize` en dev; migraciones formales pendientes.

**Checkpoint:** Sección guardada persiste; al completar 80%, perfil se activa automáticamente.

### US-008: Solicitar sugerencia IA para una sección del perfil

- [ ] [P] Implementar endpoint `POST /api/v1/company-profile/sections/:key/suggest` que encola sugerencia IA
  **MDD:** §4 POST /api/v1/company-profile/sections/:key/suggest
  **Story:** US-008
  **Archivo:** `apps/backend/src/modules/company-profile/company-profile.controller.ts`

- [ ] [P] Implementar worker BullMQ para procesar sugerencia IA y guardar resultado
  **MDD:** §4, §5.4 (estrategia de reintentos)
  **Story:** US-008
  **Archivo:** `apps/backend/src/modules/company-profile/workers/suggestion.worker.ts`

- [ ] [P] Implementar adaptador de IA para generar sugerencia (Strategy pattern)
  **MDD:** §5.6, §3 tabla company_profile_sections
  **Story:** US-008
  **Archivo:** `apps/backend/src/modules/ai-agents/adapters/suggestion.adapter.ts`

**Checkpoint:** Endpoint responde 202; worker procesa y guarda sugerencia; usuario puede aceptar/rechazar.

### US-009: Crear y gestionar campañas multicanal

- [ ] [P] Implementar CRUD de plantillas de campaña (GET/POST/GET/:id/PATCH/:id/DELETE/:id)
  **MDD:** §4 campaign-templates endpoints
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/campaign-template.controller.ts`

- [ ] [P] Implementar CRUD de campañas (POST, GET, GET/:id, PATCH/:id, DELETE/:id solo draft)
  **MDD:** §4 campaigns endpoints
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/campaign.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/campaigns/:id/generate-strategy` que encola generación IA
  **MDD:** §4 POST /api/v1/campaigns/:id/generate-strategy
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/campaign.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/campaigns/:id/budgets` para listar presupuestos
  **MDD:** §4 GET /api/v1/campaigns/:id/budgets
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/campaign.controller.ts`

- [ ] [P] Implementar endpoint `PATCH /api/v1/campaigns/:id/budgets/:budgetId` para aprobar/rechazar presupuesto
  **MDD:** §4 PATCH /api/v1/campaigns/:id/budgets/:budgetId
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/campaign.controller.ts`

- [ ] [P] Implementar CRUD de audiencias (GET, POST, PATCH/:id, DELETE/:id)
  **MDD:** §4 audiences endpoints
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/audience.controller.ts`

- [ ] [P] Implementar worker BullMQ para generar estrategia y presupuestos por IA
  **MDD:** §5.2, §4
  **Story:** US-009
  **Archivo:** `apps/backend/src/modules/campaign/workers/strategy-generator.worker.ts`

- [ ] [P] Crear migraciones para tablas `campaign_templates`, `campaigns`, `budgets`, `audiences`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/campaign/infrastructure/typeorm/`

**Checkpoint:** Creación de campaña desde plantilla; IA genera estrategia en <30s; presupuestos aprobables individualmente.

### US-010: Gestionar contenido con versionado inmutable

- [ ] [P] Implementar CRUD de contenidos (POST, GET, GET/:id, PATCH/:id, DELETE/:id)
  **MDD:** §4 contents endpoints
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/contents/:id/versions` para listar historial
  **MDD:** §4 GET /api/v1/contents/:id/versions
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/contents/:id/versions/:vid` para obtener versión específica
  **MDD:** §4 GET /api/v1/contents/:id/versions/:vid
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/contents/:id/revert/:vid` para revertir
  **MDD:** §4 POST /api/v1/contents/:id/revert/:vid
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar lógica de versionado: al PATCH sobre contenido aprobado, crear nueva versión automática
  **MDD:** §5.5 (caso borde modificación de contenido aprobado)
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/commands/update-content.command.ts`

- [ ] [P] Implementar lógica de reversión que crea nueva versión con contenido restaurado
  **MDD:** §5.5, §4
  **Story:** US-010
  **Archivo:** `apps/backend/src/modules/content/commands/revert-content.command.ts`

- [ ] [P] Implementar repositorio de versiones con contenido inmutable (append-only)
  **MDD:** §3, §5.5
  **Archivo:** `apps/backend/src/modules/content/domain/content-version.repository.ts`

- [ ] [P] Crear migraciones para tablas `contents`, `content_versions`, `content_approvals`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/content/infrastructure/typeorm/`

- [ ] [P] Implementar event sourcing: al crear, modificar, aprobar o revertir contenido, insertar evento en `events`
  **MDD:** §2.3 Event Sourcing
  **Archivo:** `apps/backend/src/modules/content/events/content-event-sourcing.service.ts`

**Checkpoint:** Cada modificación crea nueva versión; historial completo; reversión exitosa.

### US-011: Aprobar o rechazar contenido con firma digital (Kill Switch)

- [ ] [P] Implementar endpoint `POST /api/v1/contents/:id/versions/:vid/approve` con cálculo SHA-256
  **MDD:** §4 POST /api/v1/contents/:id/versions/:vid/approve, §5.1 regla 1, §5.2 flujo
  **Story:** US-011
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/contents/:id/versions/:vid/reject` con feedback
  **MDD:** §4 POST /api/v1/contents/:id/versions/:vid/reject
  **Story:** US-011
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/contents/:id/versions/:vid/request-changes`
  **MDD:** §4 POST /api/v1/contents/:id/versions/:vid/request-changes
  **Story:** US-011
  **Archivo:** `apps/backend/src/modules/content/content.controller.ts`

- [ ] [P] Implementar servicio de firma digital SHA-256 sobre body + version_id + asset_ids
  **MDD:** §5.1 regla 1, §6
  **Story:** US-011
  **Archivo:** `apps/backend/src/modules/content/services/digital-signature.service.ts`

- [ ] [P] Implementar outbox pattern para evento `ContentApproved` (persistir en outbox dentro de la misma transacción)
  **MDD:** §2.3 Outbox Pattern
  **Story:** US-011, T-003
  **Archivo:** `apps/backend/src/modules/content/events/content-approved.event.ts`

- [ ] [P] Implementar validación de que la versión no esté ya aprobada (409)
  **MDD:** §5.5 validaciones previas
  **Story:** US-011
  **Archivo:** `apps/backend/src/modules/content/commands/approve-content.command.ts`

**Checkpoint:** Aprobación genera hash SHA-256; contenido congelado; rechazo guarda feedback; modificación post-aprobación crea nueva versión.

### US-012: Visualizar y gestionar el Calendario Editorial

- [ ] [P] Implementar endpoint `GET /api/v1/calendar?month=&year=` que devuelva contenido agrupado por día
  **MDD:** §4 GET /api/v1/calendar
  **Story:** US-012
  **Archivo:** `apps/backend/src/modules/calendar/calendar.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/calendar/:date` que devuelva Detalle del Día
  **MDD:** §4 GET /api/v1/calendar/:date
  **Story:** US-012
  **Archivo:** `apps/backend/src/modules/calendar/calendar.controller.ts`

- [ ] [P] Implementar query de calendario que cruce `campaigns`, `contents`, `content_versions`
  **MDD:** §3
  **Story:** US-012
  **Archivo:** `apps/backend/src/modules/calendar/queries/get-calendar.query.ts`

- [ ] [P] Frontend: Configurar @fullcalendar/react con eventos coloreados por estado
  **MDD:** §2.4
  **Story:** US-012
  **Archivo:** `frontend/src/components/calendar/CalendarView.tsx`

- [ ] [P] Frontend: Crear componente Detalle del Día con lista de contenidos y acciones de aprobación/rechazo
  **MDD:** §2.4
  **Story:** US-012
  **Archivo:** `frontend/src/components/calendar/DayDetail.tsx`

- [ ] [P] Frontend: Integrar fetch al calendario con TanStack Query y estados de color
  **MDD:** §2.4
  **Story:** US-012
  **Archivo:** `frontend/src/hooks/useCalendar.ts`

**Checkpoint:** Calendario muestra contenido coloreado por estado; Detalle del Día permite aprobar/rechazar.

### US-013: Crear y gestionar formularios embebidos

- [ ] [P] Implementar CRUD de formularios (POST, GET, GET/:id, PATCH/:id, DELETE/:id)
  **MDD:** §4 forms endpoints
  **Story:** US-013
  **Archivo:** `apps/backend/src/modules/forms/form.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/forms/:id/snippet` para generar snippet JS embebible
  **MDD:** §4 GET /api/v1/forms/:id/snippet
  **Story:** US-013
  **Archivo:** `apps/backend/src/modules/forms/form.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/forms/:id/submit` público que cree lead
  **MDD:** §4 POST /api/v1/forms/:id/submit
  **Story:** US-013
  **Archivo:** `apps/backend/src/modules/forms/form.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/forms/:id/submissions` para listar envíos
  **MDD:** §4 GET /api/v1/forms/:id/submissions
  **Story:** US-013
  **Archivo:** `apps/backend/src/modules/forms/form.controller.ts`

- [ ] [P] Implementar lógica de duplicación de leads por email (evitar duplicados)
  **MDD:** §5.5 (caso borde)
  **Story:** US-013
  **Archivo:** `apps/backend/src/modules/crm/commands/submit-form.command.ts`

- [ ] [P] Crear migraciones para tablas `forms`, `form_submissions`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/forms/infrastructure/typeorm/`

- [ ] [P] Frontend: Crear componente snippet JS para embeber (generación condicional)
  **MDD:** §2.4
  **Story:** US-013
  **Archivo:** `frontend/src/components/forms/FormSnippet.tsx`

**Checkpoint:** Creación de formulario; snippet JS funcional; envío público crea lead; evita duplicados.

### US-014: Gestionar pipeline de leads con scoring IA

- [ ] [P] Implementar CRUD de leads (GET, GET/:id, PATCH/:id/stage, PATCH/:id, DELETE/:id)
  **MDD:** §4 leads endpoints
  **Story:** US-014
  **Archivo:** `apps/backend/src/modules/crm/lead.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/leads/:id/interactions` para historial
  **MDD:** §4 GET /api/v1/leads/:id/interactions
  **Story:** US-014
  **Archivo:** `apps/backend/src/modules/crm/lead.controller.ts`

- [ ] [P] Implementar servicio de scoring IA de leads (Strategy pattern)
  **MDD:** §5.1 regla 7
  **Story:** US-014, T-005
  **Archivo:** `apps/backend/src/modules/crm/services/lead-scoring.service.ts`

- [ ] [P] Implementar recalculo de score tras nueva interacción
  **MDD:** §5.1 regla 7
  **Story:** US-014
  **Archivo:** `apps/backend/src/modules/crm/commands/add-interaction.command.ts`

- [ ] [P] Implementar validación de eliminación de lead con propuestas firmadas (409)
  **MDD:** §5.5 (caso borde)
  **Story:** US-014
  **Archivo:** `apps/backend/src/modules/crm/commands/delete-lead.command.ts`

- [ ] [P] Crear migraciones para tablas `leads`, `lead_interactions`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/crm/infrastructure/typeorm/`

- [ ] [P] Frontend: Crear pipeline Kanban de leads con etapas y score
  **MDD:** §2.4
  **Story:** US-014
  **Archivo:** `frontend/src/components/crm/LeadPipeline.tsx`

**Checkpoint:** Pipeline con leads; score IA calculado; eliminación bloqueada si tiene propuestas firmadas.

### US-015: Subir y gestionar activos multimedia

- [ ] [P] Implementar endpoint `POST /api/v1/assets/upload` (multipart) con subida a S3
  **MDD:** §4 POST /api/v1/assets/upload
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset.controller.ts`

- [ ] [P] Implementar CRUD de assets (GET, GET/:id, PATCH/:id, DELETE/:id con verificación reference_count)
  **MDD:** §4 assets endpoints
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/assets/:id/download-url` para URL firmada
  **MDD:** §4 GET /api/v1/assets/:id/download-url
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/assets/:id/duplicate`
  **MDD:** §4 POST /api/v1/assets/:id/duplicate
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset.controller.ts`

- [ ] [P] Implementar CRUD de carpetas (asset-folders)
  **MDD:** §4 asset-folders endpoints
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset-folder.controller.ts`

- [ ] [P] Implementar gestión de etiquetas (asset-tags)
  **MDD:** §4 (implícito en assets)
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/asset-tag.controller.ts`

- [ ] [P] Implementar lógica de eliminación protegida: verificar `is_in_use` y `reference_count`
  **MDD:** §5.1 regla 9
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/commands/delete-asset.command.ts`

- [ ] [P] Implementar adaptador S3 para subida, descarga y eliminación de archivos
  **MDD:** §7.4
  **Story:** US-015
  **Archivo:** `apps/backend/src/modules/assets/infrastructure/adapters/s3.adapter.ts`

- [ ] [P] Crear migraciones para tablas `assets`, `asset_folders`, `asset_tags`, `asset_tag_assignments`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/assets/infrastructure/typeorm/`

- [ ] [P] Frontend: Crear componente de librería multimedia (lista, subida, carpetas, etiquetas)
  **MDD:** §2.4
  **Story:** US-015
  **Archivo:** `frontend/src/components/assets/AssetLibrary.tsx`

**Checkpoint:** Subida de activos; organización en carpetas/etiquetas; eliminación bloqueada si está en uso; URL firmada expira en 1h.

### US-016: Configurar dominio personalizado para dashboard whitelabel

- [ ] [P] Implementar CRUD de dominios personalizados (POST, GET, GET/:id, DELETE/:id)
  **MDD:** §4 domains endpoints
  **Story:** US-016
  **Archivo:** `apps/backend/src/modules/domains/domain.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/domains/:id/verify-dns` para verificar registro CNAME
  **MDD:** §4 POST /api/v1/domains/:id/verify-dns
  **Story:** US-016
  **Archivo:** `apps/backend/src/modules/domains/domain.controller.ts`

- [ ] [P] Implementar servicio de verificación DNS (consulta de registro CNAME)
  **MDD:** §7.4
  **Story:** US-016
  **Archivo:** `apps/backend/src/modules/domains/services/dns-verification.service.ts`

- [ ] [P] Implementar worker para emisión de SSL vía Let's Encrypt tras verificación exitosa
  **MDD:** §7.2
  **Story:** US-016
  **Archivo:** `apps/backend/src/modules/domains/workers/ssl-worker.ts`

- [ ] [P] Crear migraciones para tablas `custom_domains`, `dns_verifications`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/domains/infrastructure/typeorm/`

**Checkpoint:** Dominio registrado; verificación DNS; SSL automático; dashboard sirviendo bajo dominio personalizado.

### US-017: Solicitar, firmar y gestionar propuestas comerciales

- [ ] [P] Implementar endpoint `POST /api/v1/proposals` para solicitar propuesta IA
  **MDD:** §4 POST /api/v1/proposals
  **Story:** US-017
  **Archivo:** `apps/backend/src/modules/proposals/proposal.controller.ts`

- [ ] [P] Implementar endpoints GET listar y GET/:id para propuestas
  **MDD:** §4 GET /api/v1/proposals, GET /api/v1/proposals/:id
  **Story:** US-017
  **Archivo:** `apps/backend/src/modules/proposals/proposal.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/proposals/:id/sign` con firma digital
  **MDD:** §4 POST /api/v1/proposals/:id/sign
  **Story:** US-017
  **Archivo:** `apps/backend/src/modules/proposals/proposal.controller.ts`

- [ ] [P] Implementar endpoint `POST /api/v1/proposals/:id/reject`
  **MDD:** §4 POST /api/v1/proposals/:id/reject
  **Story:** US-017
  **Archivo:** `apps/backend/src/modules/proposals/proposal.controller.ts`

- [ ] [P] Implementar worker BullMQ para generación de propuesta por IA
  **MDD:** §5.4
  **Story:** US-017
  **Archivo:** `apps/backend/src/modules/proposals/workers/proposal-generator.worker.ts`

- [ ] [P] Crear migración para tabla `proposals`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/proposals/infrastructure/typeorm/proposal.entity.ts`

**Checkpoint:** Propuesta generada por IA; firma digital; rechazo con feedback; propuesta firmada queda congelada.

### US-018: Generar y visualizar reportes de rendimiento

- [ ] [P] Implementar endpoints CRUD de reportes (POST, GET, GET/:id)
  **MDD:** §4 reports endpoints
  **Story:** US-018
  **Archivo:** `apps/backend/src/modules/reports/report.controller.ts`

- [ ] [P] Implementar worker BullMQ para generación de reporte por IA
  **MDD:** §5.4
  **Story:** US-018
  **Archivo:** `apps/backend/src/modules/reports/workers/report-generator.worker.ts`

- [ ] [P] Crear migración para tabla `reports`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/reports/infrastructure/typeorm/report.entity.ts`

**Checkpoint:** Reporte generado por IA; listado y detalle disponibles.

### US-019: Registrar y monitorear competidores

- [ ] [P] Implementar CRUD de competidores (POST, GET, DELETE/:id)
  **MDD:** §4 competitors endpoints
  **Story:** US-019
  **Archivo:** `apps/backend/src/modules/competitors/competitor.controller.ts`

- [ ] [P] Implementar endpoint `GET /api/v1/competitors/:id/mentions`
  **MDD:** §4 GET /api/v1/competitors/:id/mentions
  **Story:** US-019
  **Archivo:** `apps/backend/src/modules/competitors/competitor.controller.ts`

- [ ] [P] Crear migraciones para tablas `competitors`, `competitor_mentions`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/competitors/infrastructure/typeorm/`

**Checkpoint:** Competidores registrados; menciones visibles.

### US-020: Consultar logs de auditoría como superadmin

- [ ] [P] Implementar endpoint `GET /api/v1/audit-logs` con filtros y paginación
  **MDD:** §4 GET /api/v1/audit-logs
  **Story:** US-020
  **Archivo:** `apps/backend/src/modules/audit/audit.controller.ts`

- [ ] [P] Implementar registro automático en `audit_logs` mediante decorador @AuditLog
  **MDD:** §6, T-006
  **Story:** US-020
  **Archivo:** `apps/backend/src/modules/audit/decorators/audit-log.decorator.ts`

- [ ] [P] Crear migración para tabla `audit_logs`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/audit/infrastructure/typeorm/audit-log.entity.ts`

- [ ] [P] Implementar política de retención de logs (90 días) con worker de limpieza
  **MDD:** §6
  **Story:** US-020
  **Archivo:** `apps/backend/src/modules/audit/workers/log-retention.worker.ts`

**Checkpoint:** Superadmin puede listar logs con filtros; logs se retienen 90 días; todas las operaciones quedan registradas.

## Frontend tasks

### General (infraestructura frontend)

- [ ] [P] Configurar proyecto React con Vite, Tailwind CSS 3.4 y Shadcn/ui
  **MDD:** §2.1
  **Archivo:** `frontend/package.json`, `frontend/vite.config.ts`

- [ ] [P] Configurar React Router v6 con lazy loading por módulo
  **MDD:** §2.4
  **Archivo:** `frontend/src/router/index.tsx`

- [ ] [P] Configurar TanStack Query (React Query) para estado del servidor
  **MDD:** §2.4
  **Archivo:** `frontend/src/providers/QueryProvider.tsx`

- [ ] [P] Configurar Zustand para estado global (sesión, UI state)
  **MDD:** §2.4
  **Archivo:** `frontend/src/store/index.ts`

- [ ] [P] Implementar manejo de tokens JWT en memoria (nunca localStorage)
  **MDD:** §6
  **Archivo:** `frontend/src/services/auth.ts`

- [ ] [P] Implementar interceptor de TanStack Query para refrescar token automáticamente
  **MDD:** §5.5 (caso borde sesión expirada)
  **Archivo:** `frontend/src/hooks/useAuthRefresh.ts`

- [ ] [P] Crear componente layout con sidebar, header y soporte de dominio personalizado
  **MDD:** §2.4
  **Archivo:** `frontend/src/components/layout/DashboardLayout.tsx`

- [ ] [P] Implementar protección de rutas según rol (JWT guard)
  **MDD:** §6
  **Archivo:** `frontend/src/guards/AuthGuard.tsx`

### US-009: Campañas (frontend)

- [ ] [P] Crear página de listado de campañas con filtros y búsqueda
  **MDD:** §2.4
  **Story:** US-009
  **Archivo:** `frontend/src/pages/campaigns/CampaignList.tsx`

- [ ] [P] Crear página de detalle de campaña con presupuestos y estrategia
  **MDD:** §2.4
  **Story:** US-009
  **Archivo:** `frontend/src/pages/campaigns/CampaignDetail.tsx`

- [ ] [P] Crear página de creación de campaña desde plantilla o desde cero
  **MDD:** §2.4
  **Story:** US-009
  **Archivo:** `frontend/src/pages/campaigns/CampaignCreate.tsx`

- [ ] [P] Crear componente KanbanBoard para visualizar campañas como tablero de estados
  **MDD:** §2.4
  **Story:** US-009
  **Archivo:** `frontend/src/components/campaigns/CampaignKanban.tsx`

- [ ] [P] Crear componente de aprobación de presupuesto individual
  **MDD:** §4 PATCH budgets
  **Story:** US-009
  **Archivo:** `frontend/src/components/campaigns/BudgetApproval.tsx`

### US-010: Contenido (frontend)

- [ ] [P] Crear página de listado de contenidos por campaña
  **MDD:** §2.4
  **Story:** US-010
  **Archivo:** `frontend/src/pages/content/ContentList.tsx`

- [ ] [P] Crear página de edición de contenido con versionado
  **MDD:** §2.4
  **Story:** US-010
  **Archivo:** `frontend/src/pages/content/ContentEdit.tsx`

- [ ] [P] Crear componente de historial de versiones con opción de revertir
  **MDD:** §2.4
  **Story:** US-010
  **Archivo:** `frontend/src/components/content/VersionHistory.tsx`

- [ ] [P] Crear componente de firma digital visible (hash SHA-256)
  **MDD:** §5.2
  **Story:** US-010
  **Archivo:** `frontend/src/components/content/SignatureBadge.tsx`

### US-011: Aprobación (frontend)

- [ ] [P] Crear componente de aprobación/rechazo con feedback
  **MDD:** §2.4
  **Story:** US-011
  **Archivo:** `frontend/src/components/content/ApprovalActions.tsx`

- [ ] [P] Crear componente de kit de descarga "Copiar y Llevar" con contenido congelado
  **MDD:** §5.2, §2.4
  **Story:** US-011
  **Archivo:** `frontend/src/components/content/DownloadKit.tsx`

- [ ] [P] Mostrar estado de aprobación con colores (verde/amarillo/rojo)
  **MDD:** §2.4
  **Story:** US-011
  **Archivo:** `frontend/src/components/content/StatusBadge.tsx`

### US-014: CRM (frontend)

- [ ] [P] Crear página de pipeline de leads con KanbanBoard
  **MDD:** §2.4
  **Story:** US-014
  **Archivo:** `frontend/src/pages/crm/LeadPipeline.tsx`

- [ ] [P] Crear componente de detalle de lead con historial de interacciones
  **MDD:** §2.4
  **Story:** US-014
  **Archivo:** `frontend/src/components/crm/LeadDetail.tsx`

### US-015: Activos (frontend)

- [ ] [P] Crear página de librería multimedia con DataTable, filtros y subida
  **MDD:** §2.4
  **Story:** US-015
  **Archivo:** `frontend/src/pages/assets/AssetLibrary.tsx`

- [ ] [P] Crear componente de subida con barra de progreso
  **MDD:** §2.4
  **Archivo:** `frontend/src/components/assets/AssetUploader.tsx`

### US-007: Onboarding (frontend)

- [ ] [P] Crear página de onboarding progresivo con secciones del cuestionario
  **MDD:** §2.4
  **Story:** US-007
  **Archivo:** `frontend/src/pages/onboarding/OnboardingWizard.tsx`

- [ ] [P] Crear componente de sugerencia IA con opciones aceptar/rechazar
  **MDD:** §2.4
  **Story:** US-008
  **Archivo:** `frontend/src/components/onboarding/AISuggestion.tsx`

### US-016: Dominios (frontend)

- [ ] [P] Crear página de configuración de dominio personalizado
  **MDD:** §2.4
  **Story:** US-016
  **Archivo:** `frontend/src/pages/settings/DomainSettings.tsx`

- [ ] [P] Crear componente de verificación DNS con progreso
  **MDD:** §2.4
  **Story:** US-016
  **Archivo:** `frontend/src/components/domains/DNSVerification.tsx`

### US-004: Login (frontend)

- [ ] [P] Crear página de login con formulario y manejo de errores
  **MDD:** §2.4
  **Story:** US-004
  **Archivo:** `frontend/src/pages/auth/LoginPage.tsx`

- [ ] [P] Crear página de setup inicial (solo cuando no hay superadmin)
  **MDD:** §2.4
  **Story:** US-001
  **Archivo:** `frontend/src/pages/auth/SetupPage.tsx`

### Otros (frontend)

- [ ] [P] Crear página de listado de formularios y generación de snippet
  **MDD:** §2.4
  **Story:** US-013
  **Archivo:** `frontend/src/pages/forms/FormList.tsx`

- [ ] [P] Crear página de propuestas comerciales
  **MDD:** §2.4
  **Story:** US-017
  **Archivo:** `frontend/src/pages/proposals/ProposalList.tsx`

- [ ] [P] Crear página de reportes
  **MDD:** §2.4
  **Story:** US-018
  **Archivo:** `frontend/src/pages/reports/ReportList.tsx`

- [ ] [P] Crear página de configuración de competidores
  **MDD:** §2.4
  **Story:** US-019
  **Archivo:** `frontend/src/pages/settings/Competitors.tsx`

- [ ] [P] Crear página de logs de auditoría (superadmin)
  **MDD:** §2.4
  **Story:** US-020
  **Archivo:** `frontend/src/pages/admin/AuditLogs.tsx`

- [ ] [P] Crear página de eventos de seguridad (superadmin)
  **MDD:** §2.4
  **Story:** US-006
  **Archivo:** `frontend/src/pages/admin/SecurityEvents.tsx`

- [ ] [P] Crear componente de banner de impersonación visible
  **MDD:** §6 (impersonación)
  **Story:** US-003
  **Archivo:** `frontend/src/components/admin/ImpersonationBanner.tsx`

## Infraestructura tasks

- [ ] [P] Crear `Dockerfile.api` (multietapa) para backend NestJS
  **MDD:** §7.4, Infra sección 1
  **Archivo:** `Dockerfile.api`

- [ ] [P] Crear `Dockerfile.frontend` (multietapa) para frontend React/Vite
  **MDD:** §7.4, Infra sección 1
  **Archivo:** `frontend/Dockerfile.frontend`

- [ ] [P] Crear `docker-compose.yml` con servicios: postgres, redis, minio, api, worker, frontend
  **MDD:** §7.4, Infra sección 2
  **Archivo:** `docker-compose.yml`

- [ ] [P] Configurar health checks para todos los servicios
  **MDD:** §7.3, Infra sección 1
  **Archivo:** `docker-compose.yml`

- [ ] [P] Crear archivo `.env.example` con todas las variables de entorno
  **MDD:** §7.5, Infra sección 3
  **Archivo:** `.env.example`

- [ ] [P] Configurar volúmenes persistentes para postgres, redis, minio
  **MDD:** §7.4, Infra sección 4
  **Archivo:** `docker-compose.yml`

- [ ] [P] Configurar CI/CD en GitHub Actions con lint, test, build, deploy
  **MDD:** §7.6
  **Archivo:** `.github/workflows/deploy.yml`

- [ ] [P] Configurar rate limiting con Redis (100 req/min público, 1000 auth, 20 IA)
  **MDD:** §5.4
  **Archivo:** `apps/backend/src/modules/auth/guards/rate-limit.guard.ts`

- [ ] [P] Configurar middleware de extracción de tenant_id desde JWT
  **MDD:** §6
  **Archivo:** `apps/backend/src/shared/middleware/tenant.middleware.ts`

- [ ] [P] Configurar logging estructurado (pino/winston) con niveles configurables
  **MDD:** §7.5
  **Archivo:** `apps/backend/src/shared/logger/logger.module.ts`

- [ ] [P] Configurar monitoreo Prometheus + Grafana (métricas) y Loki (logs)
  **MDD:** §7.4
  **Archivo:** `docker-compose.monitoring.yml` (opcional)

- [ ] [P] Configurar alertas en Slack para eventos de seguridad high/critical
  **MDD:** §6, T-007
  **Archivo:** `apps/backend/src/modules/security/workers/alert.worker.ts`

- [ ] [P] Configurar mTLS opcional entre módulos internos
  **MDD:** §7.2
  **Archivo:** `apps/backend/src/shared/tls/tls-config.ts`

- [ ] [P] Configurar Nginx reverse proxy para frontend con proxy a API
  **MDD:** Infra sección 1
  **Archivo:** `nginx.conf`

- [ ] [P] Configurar Let's Encrypt SSL automático para dominios personalizados
  **MDD:** §7.2
  **Archivo:** `apps/backend/src/modules/domains/services/ssl-certificate.service.ts`

## Tareas técnicas transversales

### T-008: Implementar arquitectura hexagonal y CQRS (estructura base)

- [ ] [P] Crear estructura de carpetas para todos los módulos (domain, application, infrastructure)
  **MDD:** §2.2, §2.3
  **Archivo:** `apps/backend/src/modules/*/`

- [ ] [P] Implementar CommandBus y QueryBus (NestJS CQRS module)
  **MDD:** §2.3
  **Archivo:** `apps/backend/src/modules/shared/cqrs.module.ts`

- [ ] [P] Implementar repositorios como puertos con implementaciones TypeORM
  **MDD:** §2.2
  **Archivo:** `apps/backend/src/modules/*/domain/*.repository.ts`

- [ ] [P] Implementar adaptadores para APIs externas (TokenLab, OpenRouter, Replicate, ElevenLabs)
  **MDD:** §2.2, §5.4
  **Archivo:** `apps/backend/src/modules/ai-agents/infrastructure/adapters/`

- [ ] [P] Implementar Circuit Breaker en adaptadores de IA (5 fallos → open 60s)
  **MDD:** §5.4
  **Archivo:** `apps/backend/src/shared/circuit-breaker/circuit-breaker.service.ts`

- [ ] [P] Implementar anonimizador de datos PII (Strategy pattern)
  **MDD:** §5.1 regla 4
  **Archivo:** `apps/backend/src/shared/domain/anonymization.strategy.ts`

### T-009: Configurar Event Sourcing y tabla events

- [ ] [P] Crear migración para tabla `events` (append-only)
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/events/infrastructure/typeorm/event.entity.ts`

- [ ] [P] Implementar proyector de eventos que actualice tablas de lectura
  **MDD:** §2.3
  **Archivo:** `apps/backend/src/modules/events/workers/event-projector.worker.ts`

- [ ] [P] Integrar inserción de eventos en cada comando (content, campaign, lead)
  **MDD:** §2.3
  **Archivo:** `apps/backend/src/modules/content/events/content-event-sourcing.service.ts` (ampliar)

### T-010: Configurar Outbox Pattern para todos los eventos de dominio

- [ ] [P] Crear migración para tabla `outbox`
  **MDD:** §3.1 SQL
  **Archivo:** `apps/backend/src/modules/outbox/infrastructure/typeorm/outbox.entity.ts`

- [ ] [P] Implementar worker de outbox que publique eventos en Redis/BullMQ
  **MDD:** §2.3
  **Archivo:** `apps/backend/src/modules/outbox/workers/outbox-publisher.worker.ts`

- [ ] [P] Integrar outbox en todos los comandos que requieran procesamiento asíncrono
  **MDD:** §2.3
  **Archivo:** `apps/backend/src/modules/outbox/outbox.module.ts`

### T-006: Implementar registro automático en audit_logs (middleware)

- [ ] [P] Crear decorador @AuditLog(action, resourceType) para handlers de comandos
  **MDD:** §6
  **Story:** US-020
  **Archivo:** `apps/backend/src/modules/audit/decorators/audit-log.decorator.ts`

- [ ] [P] Implementar interceptor para registrar automáticamente mutaciones
  **MDD:** §6
  **Archivo:** `apps/backend/src/modules/audit/interceptors/audit-log.interceptor.ts`

### T-007: Implementar sistema de alertas para eventos de seguridad high/critical

- [ ] [P] Detectar eventos de seguridad con severidad high/critical y emitir a outbox
  **MDD:** §6
  **Archivo:** `apps/backend/src/modules/security/observers/security-alert.observer.ts`

- [ ] [P] Worker de notificaciones que consuma eventos de outbox y envíe alerta (Slack/email)
  **MDD:** §6
  **Archivo:** `apps/backend/src/modules/security/workers/alert.worker.ts`

---

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                                                                                                                                                                                                                                      |
| :------ | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Junio 2025 | Creación inicial del documento Tasks para AgenteIA, derivado de MDD, Blueprint, Spec, User Stories, Contratos API, Flujos e Infraestructura. Incluye ~120 tareas distribuidas en Backend, Frontend e Infraestructura, con trazabilidad a cada user story y sección del MDD. |