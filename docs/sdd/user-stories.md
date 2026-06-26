# Historias de Usuario y backlog

## Epic: EP-001 Autenticación y gestión de sesiones

### 🎯 Objetivo del Epic

Implementar el flujo completo de autenticación nativa con JWT RS256, rotación de refresh token, bloqueo por intentos fallidos, detección de robo de tokens y cierre de sesión. Cubre los endpoints de `/auth`, `/setup` y `/health`.

⸻

### ✅ Criterios de Éxito

- El primer superadmin puede bootstrappear el sistema mediante `POST /setup/init`.
- Los usuarios (tenant y superadmin) pueden iniciar sesión con email y password; tras 5 intentos fallidos se bloquea la cuenta 15 minutos.
- El refresh token se rota en cada uso; si se reutiliza uno ya invalidado, se invalidan todas las sesiones del usuario.
- El logout elimina la sesión.
- El endpoint `GET /health` retorna estado de BD, Redis y S3.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /health`, `GET /setup/status`, `POST /setup/init`, `GET /auth/jwks`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Lógica de bloqueo de cuenta y detección de reutilización de refresh token.
- Generación de JWKS, firma RS256, almacenamiento de refresh token como hash SHA-256 en `sessions`.

**Fuera de alcance:**
- MFA (futuro).
- Integración con LDAP/AD.

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Dependencia de Redis para rate limiting y cache de sesiones; si Redis cae, el login puede degradarse.
- Rotación de refresh token puede generar confusión en clientes mal implementados.

**Suposiciones:**
- `JWT_PRIVATE_KEY` y `JWT_PUBLIC_KEY` se inyectan como variables de entorno gestionadas por Vault.
- El endpoint `/setup/init` solo está disponible si no existe ningún superadmin.

⸻

### Historia de usuario: US-001 Bootstrap del primer superadmin

#### 🧾 Historia de Usuario

**Como:** Instalador / Superadmin inicial  
**Quiero:** Poder crear el primer superadmin del sistema a través de un endpoint de bootstrap sin autenticación previa  
**Para:** Inicializar la plataforma y comenzar a gestionar tenants.

⸻

#### ✅ Criterios de Aceptación

- `GET /setup/status` devuelve `isConfigured: false` si no existe superadmin.
- `POST /setup/init` con email, password (Argon2id) y nombre crea el superadmin con `is_superadmin=true` y `tenant_id=null`.
- Si ya existe superadmin, `POST /setup/init` devuelve 409.
- Respuesta 201 con los datos del superadmin creado.
- La validación de password débil retorna 400.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- Endpoints sin autenticación.
- Se usa `users.password_hash` con Argon2id.
- Se aplica `CHECK` constraint para asegurar que superadmin no tenga `tenant_id`.

⸻

### Historia de usuario: US-002 Inicio de sesión con bloqueo por intentos fallidos

#### 🧾 Historia de Usuario

**Como:** Usuario (tenant o superadmin)  
**Quiero:** Iniciar sesión con email y password  
**Para:** Acceder al dashboard y gestionar mis campañas.

⸻

#### ✅ Criterios de Aceptación

- Login exitoso retorna access token (JWT RS256, exp 15 min), refresh token (SHA-256, exp 7 días) y datos del usuario.
- Si las credenciales son inválidas (≤4 intentos), se incrementa `login_attempts` y retorna 401.
- Al quinto intento fallido, la cuenta se bloquea 15 minutos (`locked_until`), retorna 429 con `Retry-After: 900`.
- Si la cuenta está bloqueada, retorna 429.
- Si el usuario no existe, retorna 401 genérico.
- Todos los fallos registran `security_event` con severidad `medium`.

⸻

### Historia de usuario: US-003 Renovación de token con rotación y detección de robo

#### 🧾 Historia de Usuario

**Como:** Usuario autenticado  
**Quiero:** Renovar mi access token usando el refresh token  
**Para:** Mantener la sesión activa sin tener que volver a iniciar sesión.

⸻

#### ✅ Criterios de Aceptación

- Envío de refresh token válido → se invalida el anterior, se emite nuevo par de tokens.
- Si el refresh token ha expirado o no existe, retorna 401.
- Si se reutiliza un refresh token ya invalidado, se eliminan todas las sesiones del usuario y se retorna 409 con `TOKEN_REUSE_DETECTED`.
- Se registra `security_event` de severidad `critical` en caso de reutilización.
- Superadmin puede invalidar todas las sesiones de un usuario.

⸻

### Historia de usuario: US-004 Cierre de sesión

#### 🧾 Historia de Usuario

**Como:** Usuario autenticado  
**Quiero:** Cerrar sesión  
**Para:** Finalizar mi sesión de forma segura.

⸻

#### ✅ Criterios de Aceptación

- `POST /auth/logout` con refresh token elimina la sesión de la tabla `sessions`.
- Si el token no existe, retorna 200 (idempotente).
- Si el token ya expiró, se elimina igualmente.

⸻

### Tarea técnica: T-001 Implementar generación de JWKS y firma RS256 para JWT

#### 🎯 Objetivo técnico

Crear el endpoint público `GET /auth/jwks` que expone las claves públicas JWKS para que los clientes verifiquen la firma de los JWT emitidos. Implementar rotación periódica de claves privadas.

⸻

#### 📎 Contexto y relación funcional

Relacionado con US-002 y US-003: el servidor debe firmar JWT con RS256 y permitir verificación por parte del frontend.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Generar par de claves RSA (2048 bits) al iniciar el módulo.
2. Exponer endpoint que devuelve el conjunto de claves públicas en formato JWKS.
3. Usar `jsonwebtoken` con algoritmo RS256 para firmar access tokens.
4. Implementar rotación de claves (ej. cada 30 días) y mantener historia de keys activas.

⸻

#### ✅ Done Criteria / Validación técnica

- Endpoint `GET /auth/jwks` devuelve un `keys` array con al menos una clave pública.
- Access token firmado con RS256 puede ser verificado usando la clave pública.
- Pruebas unitarias de firma y verificación.

⸻

### Tarea técnica: T-002 Implementar almacenamiento y rotación de refresh token con hash SHA-256

#### 🎯 Objetivo técnico

Almacenar refresh tokens como hash SHA-256 en la tabla `sessions`. Implementar rotación: invalidar el token anterior y emitir uno nuevo en cada uso. Detectar reutilización de tokens ya invalidados.

⸻

#### 📎 Contexto y relación funcional

### Necesario para US-003 y US-004. Afecta a la tabla `sessions` y la lógica del módulo `auth`.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Al crear refresh token, almacenar `SHA-256(token)` en `sessions.refresh_token_hash`.
2. En `POST /auth/refresh`, buscar por hash; si existe, eliminar registro, generar nuevo token y hash.
3. Si el hash no existe (token ya rotado), registrar `security_event` y eliminar todas las sesiones del usuario.
4. Worker de limpieza elimina sesiones expiradas.

⸻

#### ✅ Done Criteria / Validación técnica

- Refresh token no se almacena en texto plano.
- La rotación funciona en prueba de integración.
- La detección de reutilización invalida todas las sesiones y genera evento crítico.

⸻

### Tarea técnica: T-003 Implementar bloqueo de cuenta por intentos fallidos de login

#### 🎯 Objetivo técnico

Implementar en el comando `LoginCommand` la lógica de contador de intentos, bloqueo de 15 minutos tras 5 fallos consecutivos, y registro de eventos de seguridad.

⸻

#### 📎 Contexto y relación funcional

### Derivado del MDD §5.2, §5.5, §5.6 (UAT 8) y CU-2. Relacionado con US-002.

⸻

#### 🧪 Pasos técnicos sugeridos *(si aplica)*

1. En `POST /auth/login`, si el usuario existe y password falla, incrementar `login_attempts`.
2. Si `login_attempts >= 5`, asignar `locked_until = NOW() + 15 min` y registrar `security_event` con severidad `medium`.
3. En login, verificar si `locked_until > NOW()`; si sí, retornar 429.
4. Al login exitoso, resetear `login_attempts = 0`.

⸻

#### ✅ Done Criteria / Validación técnica

- Prueba automatizada con 5 fallos consecutivos → bloqueo.
- Después de 15 minutos (mockeable), el login vuelve a funcionar.
- Se registra `security_event` en cada bloqueo.

⸻

## Epic: EP-002 Administración multi-tenant y superadmin

### 🎯 Objetivo del Epic

Permitir al superadmin gestionar tenants (crear, actualizar, suspender, eliminar), impersonar cualquier tenant con auditoría completa, visualizar logs de auditoría y eventos de seguridad, e invalidar sesiones de usuarios.

⸻

### ✅ Criterios de Éxito

- El superadmin puede crear, listar, actualizar y eliminar tenants (con protección contra eliminar el último superadmin).
- La impersonalización permite al superadmin actuar como un usuario específico de un tenant durante 1 hora, con registro de cada acción en `impersonation_logs`.
- El superadmin puede ver `audit_logs` y `security_events` con filtros.
- El superadmin puede invalidar todas las sesiones de un usuario.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `POST /tenants`, `GET /tenants`, `GET /tenants/:id`, `PATCH /tenants/:id`, `DELETE /tenants/:id`, `POST /superadmin/impersonate`, `DELETE /superadmin/impersonate`, `GET /audit-logs`, `GET /security-events`, `POST /admin/sessions/invalidate`.
- Tablas: `tenants`, `impersonation_logs`, `audit_logs`, `security_events`.
- Middleware de rol superadmin.

**Fuera de alcance:**
- Gestión de planes de facturación (externo).
- Diferenciación de permisos entre administrador y usuario de tenant (futura versión).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Impersonalización mal implementada puede permitir acciones destructivas. El MDD prohíbe operaciones destructivas durante impersonación.
- Retención de logs de 90 días debe configurarse explícitamente.

**Suposiciones:**
- Solo el superadmin puede acceder a estos endpoints.
- El superadmin no tiene `tenant_id` asociado.

⸻

### Historia de usuario: US-005 Gestión de tenants por superadmin

#### 🧾 Historia de Usuario

**Como:** Superadmin  
**Quiero:** Crear, listar, actualizar y eliminar tenants  
**Para:** Gestionar el ecosistema multi-tenant de la plataforma.

⸻

#### ✅ Criterios de Aceptación

- `POST /tenants` con name, slug, plan crea el tenant y retorna 201.
- `GET /tenants` lista todos los tenants con paginación.
- `PATCH /tenants/:id` actualiza campos permitidos (plan, status, settings).
- `DELETE /tenants/:id` elimina el tenant en cascada (según modelo de datos) pero no permite eliminar si es el último superadmin.
- Si el slug ya existe, retorna 409.
- Los usuarios de un tenant suspendido no pueden autenticarse.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- El endpoint `DELETE /tenants/:id` verifica que no sea el último superadmin (regla de negocio §5.6).
- La suspensión del tenant se valida en el middleware de autenticación.

⸻

### Historia de usuario: US-006 Impersonalización de superadmin con auditoría

#### 🧾 Historia de Usuario

**Como:** Superadmin  
**Quiero:** Impersonar un usuario específico de un tenant  
**Para:** Realizar soporte directo o ver campañas del cliente, con todas las acciones registradas.

⸻

#### ✅ Criterios de Aceptación

- `POST /superadmin/impersonate` con tenantId y userId genera un token temporal de 1 hora.
- El dashboard muestra banner "IMPERSONANDO" durante la impersonación.
- Cada acción realizada con el token de impersonación se registra en `impersonation_logs`.
- No se permiten operaciones destructivas (eliminar asset, eliminar campaña, etc.) durante impersonación.
- `DELETE /superadmin/impersonate` restaura el token original del superadmin.
- Si el superadmin ya está impersonando, retorna 409.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- El token de impersonación tiene alcance limitado y expira en 1 hora.
- Se usa un JWT con claims `impersonating: true`, `tenantId`, `userId`.

⸻

### Historia de usuario: US-007 Visualización de logs de auditoría y eventos de seguridad

#### 🧾 Historia de Usuario

**Como:** Superadmin  
**Quiero:** Poder ver los logs de auditoría y eventos de seguridad con filtros  
**Para:** Auditar acciones de los usuarios y detectar incidentes de seguridad.

⸻

#### ✅ Criterios de Aceptación

- `GET /audit-logs` devuelve lista paginada con filtros por tenantId, action, rango de fechas.
- Cada log incluye: tenantId, userId, action, resourceType, resourceId, ipAddress, createdAt.
- `GET /security-events` devuelve lista paginada con filtros por severity, eventType, rango de fechas.
- Los logs son append-only y se retienen por 90 días.
- Sin resultados, devuelve lista vacía.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- Tablas `audit_logs` y `security_events` son inmutable (append-only).
- Índices en `tenant_id`, `created_at` para consultas eficientes.

⸻

### Historia de usuario: US-008 Invalidación de sesiones de un usuario por superadmin

#### 🧾 Historia de Usuario

**Como:** Superadmin  
**Quiero:** Poder invalidar todas las sesiones activas de un usuario  
**Para:** Forzar un reinicio de sesión en caso de sospecha de compromiso o para aplicar cambios de permisos.

⸻

#### ✅ Criterios de Aceptación

- `POST /admin/sessions/invalidate` con userId elimina todos los registros de `sessions` de ese usuario.
- Retorna 200 con `invalidatedCount`.
- Si el usuario no existe, retorna 404.
- El usuario afectado debe iniciar sesión nuevamente en su próximo acceso.

⸻

### Tarea técnica: T-004 Implementar middleware de rol superadmin y validación de acciones destructivas en impersonación

#### 🎯 Objetivo técnico

Crear un guard personalizado que verifique `is_superadmin` en los claims del JWT. Además, implementar un decorador o interceptor que impida operaciones destructivas cuando el token es de impersonación.

⸻

#### 📎 Contexto y relación funcional

### Necesario para US-005, US-006 y US-007. Afecta a todos los endpoints protegidos con `JWT+SA`.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Crear `@Roles('superadmin')` decorator que extraiga rol del JWT.
2. En `POST /superadmin/impersonate`, generar token temporal con claim `impersonating: true`.
3. En operaciones destructivas (DELETE, PATCH sensibles), verificar que `impersonating` no sea true; si lo es, retornar 403.
4. Registrar cada acción en `impersonation_logs` mediante un interceptor.

⸻

#### ✅ Done Criteria / Validación técnica

- Un superadmin sin impersonar puede eliminar tenants.
- Un superadmin impersonando no puede eliminar assets ni campañas.
- Cada acción impersonada queda registrada en logs.

⸻

## Epic: EP-003 Onboarding y perfil de empresa

### 🎯 Objetivo del Epic

Permitir al administrador de tenant completar el perfil de empresa progresivamente, con ayuda de sugerencias de IA. El perfil se activa al alcanzar ≥80% de obligatorias completadas y es utilizado por los agentes de IA para generar contenido personalizado.

⸻

### ✅ Criterios de Éxito

- El administrador puede ver, editar y completar secciones del cuestionario en múltiples sesiones.
- Puede solicitar sugerencias de IA para una sección.
- Al alcanzar ≥80% de obligatorias, el perfil se marca como `completed` y los agentes lo usan inmediatamente.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /company-profile`, `PATCH /company-profile`, `GET /company-profile/sections`, `PATCH /company-profile/sections/:key`, `POST /company-profile/sections/:key/suggest`.
- Tablas: `company_profiles`, `company_profile_sections`.
- Worker que procesa la sugerencia IA.

**Fuera de alcance:**
- Cuestionarios dinámicos configurables por el superadmin (futuro).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- La IA puede sugerir datos incorrectos; el usuario debe aceptar o rechazar manualmente.
- El cálculo de `completion_percentage` debe ser preciso.

**Suposiciones:**
- El perfil se crea automáticamente al crear el tenant.

⸻

### Historia de usuario: US-009 Onboarding progresivo del perfil de empresa

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Completar el cuestionario de perfil de empresa en varias sesiones, con ayuda de sugerencias de IA  
**Para:** Que la IA conozca mi negocio y genere contenido personalizado.

⸻

#### ✅ Criterios de Aceptación

- `GET /company-profile/sections` devuelve lista de secciones obligatorias y opcionales, con estado de completitud.
- `PATCH /company-profile/sections/:key` guarda los datos JSON y actualiza `completion_percentage`.
- `POST /company-profile/sections/:key/suggest` encola generación IA y retorna sugerencia asíncrona.
- Cuando `completion_percentage >= 80`, el perfil cambia a `completed` y los agentes lo utilizan.
- El progreso se conserva entre sesiones.
- El perfil puede modificarse incluso después de completado.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- El cálculo de `completion_percentage` se hace en el dominio: `(obligatorias_completadas / total_obligatorias) * 100`.
- La sugerencia IA se procesa mediante un worker BullMQ que consulta datos públicos o históricos.

⸻

## Epic: EP-004 Campañas y estrategia multicanal

### 🎯 Objetivo del Epic

Permitir al administrador de tenant crear campañas multicanal desde plantillas o desde cero, solicitar generación de estrategia y presupuestos por IA, y aprobar/rechazar cada presupuesto individualmente. Las campañas avanzan de estado (`draft → active → paused → completed`) con control de presupuestos.

⸻

### ✅ Criterios de Éxito

- El usuario puede crear campañas desde plantilla o manualmente.
- La IA genera estrategia y presupuestos en menos de 30 segundos (asíncrono).
- Los presupuestos pueden aprobarse o rechazarse individualmente.
- La campaña pasa a estado `active` solo si todos los presupuestos están aprobados.
- La modificación de una campaña con presupuestos aprobados requiere re-aprobación.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /campaign-templates`, `POST /campaign-templates`, `GET /campaigns`, `POST /campaigns`, `PATCH /campaigns`, `DELETE /campaigns`, `POST /campaigns/:id/generate-strategy`, `GET /campaigns/:id/budgets`, `PATCH /campaigns/:id/budgets/:budgetId`.
- Tablas: `campaign_templates`, `campaigns`, `budgets`, `ai_agents`, `agent_assignments`.
- Worker de generación de estrategia.

**Fuera de alcance:**
- Publicación automática en redes sociales (el kit de descarga es manual).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Dependencia de APIs de IA externas; fallbacks y circuit breaker necesarios.
- Los presupuestos propuestos por IA pueden no ser realistas; deben ser revisables.

**Suposiciones:**
- Las plantillas predefinidas se crean mediante seed data.

⸻

### Historia de usuario: US-010 Creación de campaña multicanal desde plantilla o desde cero

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Crear una campaña multicanal seleccionando una plantilla predefinida o definiendo objetivos manualmente  
**Para:** Iniciar una campaña de marketing personalizada.

⸻

#### ✅ Criterios de Aceptación

- `POST /campaigns` con campos obligatorios (name, platforms, objective) crea campaña en estado `draft`.
- Si se especifica `template_id`, se copian valores de la plantilla.
- La campaña se muestra en el listado con su estado y fecha de creación.
- No se puede eliminar una campaña que no esté en `draft`.
- Las plantillas predefinidas están disponibles en `GET /campaign-templates`.

⸻

### Historia de usuario: US-011 Generación de estrategia y presupuestos por IA

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Solicitar a la IA que genere la estrategia y presupuestos para mi campaña  
**Para:** Obtener recomendaciones profesionales sin necesidad de una agencia.

⸻

#### ✅ Criterios de Aceptación

- `POST /campaigns/:id/generate-strategy` retorna 202 con `assignmentId` y status `processing`.
- Un worker IA genera `strategy` (JSON) y presupuestos por plataforma en `budgets`.
- El usuario puede ver los presupuestos generados en `GET /campaigns/:id/budgets`.
- Si la generación falla (3 reintentos), `agent_assignments` queda como `failed` y se notifica al usuario.
- El usuario puede reintentar la generación.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- La generación se encola en BullMQ usando el patrón Command + Observer.
- Se implementa Circuit Breaker para APIs de IA externas.

⸻

### Historia de usuario: US-012 Aprobación/rechazo de presupuestos de campaña

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Aprobar o rechazar cada presupuesto generado por IA para mi campaña  
**Para:** Controlar el gasto por plataforma antes de activar la campaña.

⸻

#### ✅ Criterios de Aceptación

- `PATCH /campaigns/:id/budgets/:budgetId` con `approved: true/false` actualiza el estado.
- Si todos los presupuestos están aprobados, la campaña pasa a `active`.
- Si algún presupuesto se rechaza, la campaña permanece en `draft` hasta que se aprueben todos o se generen nuevos.
- La modificación de la campaña después de aprobar presupuestos requiere re-aprobación de los presupuestos modificados.

⸻

### Tarea técnica: T-005 Implementar worker de generación de estrategia IA con outbox pattern

#### 🎯 Objetivo técnico

Crear el worker que procesa `agent_assignments` para generar estrategia y presupuestos. Usar Outbox Pattern para garantizar que eventos como `CampaignStrategyGenerated` se publiquen de forma confiable.

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-011. Depende de la tabla `outbox` y de los adaptadores de APIs de IA.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Al recibir `POST /campaigns/:id/generate-strategy`, crear `agent_assignment` con status `pending` y escribir evento en `outbox`.
2. Worker BullMQ lee `outbox`, llama al adaptador IA (OpenRouter, TokenLab) y actualiza `agent_assignments.result`.
3. Si falla, reintenta con backoff exponencial (3 intentos) y circuit breaker.
4. Al éxito, actualizar `campaigns.strategy` e insertar presupuestos en `budgets`.
5. Escribir evento `CampaignStrategyGenerated` en `outbox` para notificaciones.

⸻

#### ✅ Done Criteria / Validación técnica

- Worker procesa correctamente la generación.
- Los reintentos y circuit breaker funcionan.
- El outbox se vacía correctamente.

⸻

## Epic: EP-005 Contenido y versionado

### 🎯 Objetivo del Epic

Gestionar la creación, edición, versionado inmutable y reversión de contenidos. Cada modificación crea una nueva versión; el historial es completo y las versiones anteriores nunca se modifican. Las ediciones sobre contenido aprobado invalidan la firma anterior.

⸻

### ✅ Criterios de Éxito

- Cada creación de contenido genera automáticamente la primera versión.
- Cada edición crea una nueva versión (`version_number+1`), dejando la anterior intacta.
- El historial de versiones es accesible y muestra autor, fecha, motivo.
- La reversión a una versión anterior crea una nueva versión con el contenido restaurado.
- Si el contenido estaba aprobado, al editar pasa a `in_changes` y la firma anterior se invalida.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /contents`, `POST /contents`, `GET /contents/:id`, `PATCH /contents/:id`, `DELETE /contents/:id`, `GET /contents/:id/versions`, `GET /contents/:id/versions/:vid`, `POST /contents/:id/revert/:vid`.
- Tablas: `contents`, `content_versions`, `content_approvals`.

**Fuera de alcance:**
- Eliminación de versiones individuales (son inmutables).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Si la base de datos falla durante la creación de versión, se pierde el cambio. La operación debe ser transaccional.

**Suposiciones:**
- `current_version_id` en `contents` se actualiza con cada nueva versión.

⸻

### Historia de usuario: US-013 Creación y edición de contenido con versionado automático

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Crear y editar contenido (texto, assets) para mis campañas  
**Para:** Generar piezas de marketing personalizadas.

⸻

#### ✅ Criterios de Aceptación

- `POST /contents` con title, type, campaign_id crea contenido y primera versión (version_number=1).
- `PATCH /contents/:id` con cambios crea una nueva versión con version_number incrementado.
- La versión anterior queda intacta en el historial.
- El historial de versiones muestra autor, número de versión, fecha, motivo, y hash de firma si aplica.
- Si el contenido estaba aprobado (`status='approved'`), al editar pasa a `in_changes` y se invalida la firma anterior.

⸻

### Historia de usuario: US-014 Reversión a versión anterior

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Poder revertir un contenido a una versión anterior  
**Para:** Recuperar una pieza que funcionaba mejor o deshacer cambios no deseados.

⸻

#### ✅ Criterios de Aceptación

- `POST /contents/:id/revert/:vid` crea una nueva versión con el body y assets de la versión especificada.
- La versión original de la que se revierte no se modifica.
- Si la versión a revertir no tiene `signature_hash`, la nueva versión queda en `draft`.
- Si la versión a revertir tiene `signature_hash`, la nueva versión puede ser aprobada nuevamente.
- El historial refleja la reversión como una nueva entrada.

⸻

### Tarea técnica: T-006 Implementar lógica de versionado inmutable con FK circular

#### 🎯 Objetivo técnico

Implementar en el dominio la creación de nuevas versiones, la actualización de `current_version_id` y la invalidación de firma al editar contenido aprobado. Gestionar la FK circular entre `contents` y `content_versions`.

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-013 y US-014. Afecta a las tablas `contents` y `content_versions`.

⸻

#### ✅ Done Criteria / Validación técnica

- La FK circular se gestiona con `ALTER TABLE ADD CONSTRAINT` como en el esquema SQL.
- Al crear una versión, se actualiza `contents.current_version_id`.
- Si el contenido estaba aprobado, se lanza evento `ContentSignatureInvalidated`.
- Pruebas de integración verifican inmutabilidad de versiones anteriores.

⸻

## Epic: EP-006 Aprobación digital (Kill Switch)

### 🎯 Objetivo del Epic

Implementar el flujo de aprobación digital de contenido con firma SHA-256, inmutabilidad post-firma y liberación del kit de descarga. Ningún contenido se entrega sin la aprobación explícita del cliente.

⸻

### ✅ Criterios de Éxito

- El administrador puede aprobar, rechazar o solicitar cambios sobre una versión de contenido.
- Al aprobar, se calcula y almacena el hash SHA-256 (body + "|" + version_id + "|" + asset_ids ordenados).
- El contenido queda congelado: no se puede modificar sin crear nueva versión.
- Se libera el kit de descarga con contenido aprobado.
- Cualquier modificación posterior invalida la firma y pausa la descarga.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `POST /contents/:id/versions/:vid/approve`, `POST /contents/:id/versions/:vid/reject`, `POST /contents/:id/versions/:vid/request-changes`.
- Tablas: `content_approvals`.
- Cálculo de hash en dominio.

**Fuera de alcance:**
- Publicación automática en redes sociales.

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Caída de BD durante aprobación: la transacción revierte, el cliente debe reintentar (operación idempotente).
- El hash debe ser consistente; cualquier cambio en el algoritmo requeriría migración.

**Suposiciones:**
- El kit de descarga se genera como archivo ZIP con contenido congelado (no especificado en detalle, se asume para HU).

⸻

### Historia de usuario: US-015 Aprobación digital de contenido con firma SHA-256

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Aprobar una versión de contenido con firma digital  
**Para:** Autorizar la publicación de la pieza y liberar el kit de descarga.

⸻

#### ✅ Criterios de Aceptación

- `POST /contents/:id/versions/:vid/approve` calcula SHA-256(body + "|" + vid + "|" + asset_ids_ordenados).
- Almacena `signature_hash` en `content_versions` y `content_approvals`.
- El contenido cambia a estado `approved` y se congela.
- Si la versión ya está aprobada, retorna 409.
- Se escribe evento `ContentApproved` en el outbox.
- El kit de descarga se libera para el día correspondiente.

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- El hash se calcula en la capa de dominio, dentro de la transacción.
- Los `asset_ids` se ordenan alfabéticamente antes de concatenar.

⸻

### Historia de usuario: US-016 Rechazo y solicitud de cambios sobre contenido

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Rechazar una versión o solicitar cambios al contenido  
**Para:** Indicar que no es aceptable y necesita modificaciones.

⸻

#### ✅ Criterios de Aceptación

- `POST /contents/:id/versions/:vid/reject` con feedback crea `content_approvals` con status `rejected`, no congela el contenido.
- `POST /contents/:id/versions/:vid/request-changes` marca la versión como `changes_requested`.
- El creador del contenido puede ver el feedback y crear una nueva versión.
- El contenido no puede aprobarse mientras esté en `changes_requested`.

⸻

### Tarea técnica: T-007 Implementar cálculo de hash SHA-256 en dominio y registro en content_approvals

#### 🎯 Objetivo técnico

Crear el servicio de dominio `ContentHasher` que calcula el hash sobre `body + "|" + version_id + "|" + sorted_asset_ids`. Implementar `ApproveContentCommand` que persiste la aprobación y el hash en una transacción.

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-015. Afecta a las tablas `content_versions`, `content_approvals` y `outbox`.

⸻

#### ✅ Done Criteria / Validación técnica

- El hash calculado coincide con una verificación manual.
- La transacción incluye inserción en `content_approvals`, actualización de `contents` y `content_versions`, y escritura en `outbox`.
- La firma se invalida si el contenido se edita después de aprobado.

⸻

## Epic: EP-007 Calendario Editorial

### 🎯 Objetivo del Epic

Proporcionar una vista mensual/semanal del calendario con contenidos programados, códigos de color por estado (verde=aprobado, amarillo=borrador, rojo=bloqueado/rechazado) y un Detalle del Día con previsualización y acciones de aprobación/rechazo.

⸻

### ✅ Criterios de Éxito

- El calendario muestra contenidos agrupados por fecha con colores de estado.
- Al seleccionar un día, se muestra el Detalle del Día con contenido, estado y acciones.
- El usuario puede aprobar/rechazar desde el detalle.
- Si un contenido está aprobado, muestra el hash SHA-256 y el slot en verde.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /calendar?month=&year=`, `GET /calendar/:date`.
- Frontend: componente @fullcalendar/react personalizado.

**Fuera de alcance:**
- Vista semanal (se asume que el endpoint permite filtro semanal).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Gran cantidad de contenidos puede afectar rendimiento; se debe paginar o cachear.

**Suposiciones:**
- Los contenidos se asocian a fechas mediante el campo `created_at` o una fecha programada (no especificado en modelo, se asume que se añadirá columna `scheduled_date` o se deriva de campaña).

⸻

### Historia de usuario: US-017 Visualización del Calendario Editorial

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Ver un calendario mensual con todos los contenidos programados, con colores que indiquen su estado  
**Para:** Tener una visión general de mi plan de contenidos y detectar rápidamente piezas pendientes de aprobación.

⸻

#### ✅ Criterios de Aceptación

- `GET /calendar?month=5&year=2026` devuelve contenidos agrupados por fecha, con estado y color.
- Los colores: verde = aprobado, amarillo = borrador, rojo = bloqueado/rechazado.
- Al hacer clic en un día, se navega al Detalle del Día.
- Si no hay contenido para un mes, se muestra calendario vacío.

⸻

### Historia de usuario: US-018 Detalle del Día con previsualización y acciones

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Ver el Detalle del Día con la lista de contenidos programados, su previsualización en lenguaje de negocio, y poder aprobar/rechazar cada uno  
**Para:** Revisar y decidir rápidamente qué publicar.

⸻

#### ✅ Criterios de Aceptación

- `GET /calendar/:date` devuelve lista de contenidos con versión actual, estado, hash si aprobado.
- Cada contenido muestra previsualización sin jerga técnica.
- Si el contenido está en borrador, muestra botones de aprobar/rechazar/solicitar cambios.
- Al aprobar desde el detalle, el slot se actualiza a verde y muestra el hash.
- El kit de descarga se libera solo para contenido aprobado.

⸻

## Epic: EP-008 CRM y captura de leads

### 🎯 Objetivo del Epic

Gestionar la captura de leads a través de formularios embebidos, el pipeline de CRM con scoring IA, historial de interacciones y control de eliminaciones de leads con propuestas firmadas.

⸻

### ✅ Criterios de Éxito

- Un visitante externo puede enviar un formulario, creando un lead en el pipeline.
- El administrador puede ver, filtrar, actualizar etapa y eliminar leads.
- El scoring IA se calcula automáticamente en cada interacción.
- No se puede eliminar un lead en etapa `customer` con propuestas firmadas.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /forms`, `POST /forms`, `GET /forms/:id`, `PATCH /forms/:id`, `DELETE /forms/:id`, `GET /forms/:id/snippet`, `POST /forms/:id/submit`, `GET /forms/:id/submissions`, `GET /leads`, `GET /leads/:id`, `PATCH /leads/:id/stage`, `PATCH /leads/:id`, `DELETE /leads/:id`, `GET /leads/:id/interactions`.
- Tablas: `forms`, `form_submissions`, `leads`, `lead_interactions`.
- Worker de scoring IA.

**Fuera de alcance:**
- Integración con CRMs externos.

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Envío de PII a APIs externas sin anonimización; el adaptador de IA debe pseudonimizar.
- El scoring IA depende de datos demográficos y comportamiento; puede ser impreciso al inicio.

**Suposiciones:**
- El formulario embebido se sirve desde el frontend del tenant (dominio personalizado o plataforma).

⸻

### Historia de usuario: US-019 Creación y gestión de formularios embebidos

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Crear formularios personalizados con campos, estilos y obtener un snippet JS/iframe para embekerlos en mi sitio web  
**Para:** Capturar leads directamente desde mi página.

⸻

#### ✅ Criterios de Aceptación

- `POST /forms` con name, fields, style crea el formulario y genera `snippet_js`.
- `GET /forms/:id/snippet` devuelve el código embebible.
- `GET /forms` lista todos los formularios del tenant con su estado (activo/inactivo).
- `PATCH /forms/:id` actualiza campos y estilos.
- `DELETE /forms/:id` elimina el formulario y sus envíos (cascada).
- Los formularios inactivos no aceptan envíos.

⸻

### Historia de usuario: US-020 Captura de lead desde formulario embebido

#### 🧾 Historia de Usuario

**Como:** Visitante externo  
**Quiero:** Llenar un formulario en el sitio web de una empresa y enviar mis datos  
**Para:** Solicitar información o registrarme como lead.

⸻

#### ✅ Criterios de Aceptación

- `POST /forms/:id/submit` con datos (email requerido) crea `form_submission` y `lead`.
- El lead aparece en el pipeline del tenant con `score=0`, `stage='prospect'`.
- Si el formulario está inactivo, retorna 404.
- Si el email es inválido, retorna 400.
- Se encola un worker para recalcular score IA de forma asíncrona.

⸻

### Historia de usuario: US-021 Gestión de leads y pipeline CRM

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Ver mi pipeline de leads, filtrar por etapa y score, actualizar etapas y ver historial de interacciones  
**Para:** Gestionar el proceso de ventas y priorizar leads calientes.

⸻

#### ✅ Criterios de Aceptación

- `GET /leads` lista leads con filtros por stage, score_gt, paginación.
- `GET /leads/:id` muestra detalle del lead, score, etapa, última interacción.
- `PATCH /leads/:id/stage` cambia la etapa (e.g., prospect → qualified → opportunity → customer) y registra interacción.
- `DELETE /leads/:id` elimina el lead, pero bloquea con 409 si está en `customer` con propuestas firmadas.
- `GET /leads/:id/interactions` devuelve historial de interacciones.

⸻

### Tarea técnica: T-008 Implementar worker de scoring IA para leads

#### 🎯 Objetivo técnico

Crear un worker que escuche eventos `LeadCreated` y `LeadInteractionAdded` para recalcular el score del lead usando factores como número de interacciones, tiempo desde último contacto, datos demográficos completados y origen del lead.

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-020 y US-021. Afecta a la tabla `leads.score`.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Definir algoritmo de scoring en capa de dominio (Strategy pattern).
2. Worker BullMQ consume eventos de outbox y actualiza `leads.score`.
3. El rango es 0-100.
4. Se recalcula en cada nueva interacción.

⸻

#### ✅ Done Criteria / Validación técnica

- Un lead nuevo tiene score 0.
- Tras una interacción, el score se actualiza.
- El algoritmo puede ser reemplazado dinámicamente (Strategy).

⸻

## Epic: EP-009 Librería de activos multimedia

### 🎯 Objetivo del Epic

Gestionar la subida, organización en carpetas/etiquetas, duplicación y eliminación de activos multimedia por tenant. Control de referencias para evitar eliminación de activos en uso.

⸻

### ✅ Criterios de Éxito

- El usuario puede subir activos (imágenes, videos, documentos) con validación de tipo y tamaño.
- Puede organizar en carpetas y etiquetar.
- Puede duplicar un activo (misma referencia S3, nuevo registro con `reference_count=0`).
- No se puede eliminar un activo si `is_in_use=true` o `reference_count > 0`.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /assets`, `POST /assets/upload`, `GET /assets/:id`, `PATCH /assets/:id`, `DELETE /assets/:id`, `GET /assets/:id/download-url`, `POST /assets/:id/duplicate`, `GET /asset-folders`, `POST /asset-folders`, `PATCH /asset-folders/:id`, `DELETE /asset-folders/:id`.
- Tablas: `assets`, `asset_folders`, `asset_tags`, `asset_tag_assignments`.
- Integración con S3 para subida y URLs firmadas.

**Fuera de alcance:**
- Edición de imágenes en línea.

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Subida de archivos maliciosos; validación de tipo MIME y análisis de virus (futuro).
- URLs firmadas expiran; el frontend debe manejarlo.

**Suposiciones:**
- El límite `max_assets_size` se verifica antes de la subida.

⸻

### Historia de usuario: US-022 Subida y gestión de activos multimedia

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Subir imágenes, videos y documentos a mi librería, organizarlos en carpetas y etiquetarlos  
**Para:** Tener todos mis recursos multimedia disponibles para usar en campañas.

⸻

#### ✅ Criterios de Aceptación

- `POST /assets/upload` (multipart) sube el archivo, lo guarda en S3 y crea registro en `assets`.
- Valida tipo MIME y tamaño según `max_assets_size` del plan; si excede, retorna 413.
- `GET /assets` lista activos con filtros por tipo, carpeta, búsqueda.
- `PATCH /assets/:id` renombra, cambia carpeta o etiquetas.
- `POST /assets/:id/duplicate` crea nuevo asset referenciando el mismo objeto S3, con `reference_count=0`.
- `DELETE /assets/:id` solo si `is_in_use=false` y `reference_count=0`; si no, 409.

⸻

### Historia de usuario: US-023 Obtención de URL firmada de descarga

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Obtener una URL firmada temporal para descargar un activo  
**Para:** Compartir o descargar el archivo de forma segura.

⸻

#### ✅ Criterios de Aceptación

- `GET /assets/:id/download-url` retorna una URL firmada que expira en 1 hora.
- La URL permite descargar el archivo desde S3.
- Si el activo no existe, retorna 404.

⸻

### Tarea técnica: T-009 Implementar integración con S3 para subida y URLs firmadas

#### 🎯 Objetivo técnico

Crear adaptador de almacenamiento S3 (Puerto `StoragePort`) que implemente subida de archivos, generación de URLs firmadas y eliminación. Usar el patrón Adapter para ser intercambiable (DigitalOcean Spaces, AWS S3, MinIO).

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-022 y US-023. Afecta al módulo `assets`.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Definir interfaz `IStorageService` en capa de aplicación.
2. Implementar `S3StorageAdapter` usando SDK AWS S3.
3. Endpoints: para subida, generar URL firmada para upload directo o recibir multipart.
4. Para descarga, generar URL firmada con expiración de 1 hora.

⸻

#### ✅ Done Criteria / Validación técnica

- Subida exitosa de archivo a S3 y creación de registro en BD.
- URL firmada funciona para descarga.
- Eliminación de asset elimina también el objeto S3 si `reference_count=0`.

⸻

## Epic: EP-010 Propuestas comerciales

### 🎯 Objetivo del Epic

Permitir al administrador de tenant solicitar propuestas comerciales generadas por IA, visualizarlas y firmarlas digitalmente (o rechazarlas). Las propuestas siguen estados: `draft → submitted → accepted/rejected`.

⸻

### ✅ Criterios de Éxito

- El usuario puede solicitar una propuesta para una campaña.
- La IA genera el contenido de la propuesta de forma asíncrona.
- El usuario puede firmar digitalmente la propuesta (hash SHA-256) o rechazarla.
- Una vez firmada, la propuesta queda congelada.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `POST /proposals`, `GET /proposals`, `GET /proposals/:id`, `POST /proposals/:id/sign`, `POST /proposals/:id/reject`.
- Tablas: `proposals`.
- Worker de generación IA.

**Fuera de alcance:**
- Plantillas de propuestas personalizables.

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Propuesta generada puede contener errores; el usuario debe revisar antes de firmar.

**Suposiciones:**
- La propuesta se genera con datos del perfil de empresa y campaña.

⸻

### Historia de usuario: US-024 Solicitud y firma de propuestas comerciales

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Solicitar una propuesta comercial generada por IA, revisarla y firmarla digitalmente  
**Para:** Autorizar formalmente una campaña o servicio.

⸻

#### ✅ Criterios de Aceptación

- `POST /proposals` con `campaign_id` crea propuesta en `draft` y encola generación IA.
- `GET /proposals/:id` muestra el contenido JSON de la propuesta.
- `POST /proposals/:id/sign` calcula hash SHA-256 del contenido, firma la propuesta y cambia a `accepted`.
- `POST /proposals/:id/reject` cambia a `rejected`.
- Si ya está firmada, retorna 409.
- La propuesta firmada queda congelada.

⸻

## Epic: EP-011 Monitoreo de competencia

### 🎯 Objetivo del Epic

Permitir al administrador de tenant registrar competidores y visualizar menciones recolectadas por la IA.

⸻

### ✅ Criterios de Éxito

- El usuario puede registrar, listar y eliminar competidores.
- Puede ver menciones de cada competidor.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `GET /competitors`, `POST /competitors`, `DELETE /competitors/:id`, `GET /competitors/:id/mentions`.
- Tablas: `competitors`, `competitor_mentions`.

**Fuera de alcance:**
- Recolección automática de menciones (worker opcional, no detallado).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- La recolección de menciones depende de servicios externos de scraping/web, puede fallar.

**Suposiciones:**
- Se asume que un worker futuro recolectará menciones; en MVP se puede ingresar manualmente.

⸻

### Historia de usuario: US-025 Registro y monitoreo de competidores

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Registrar mis competidores y ver las menciones que la IA recolecta sobre ellos  
**Para:** Mantenerme informado sobre la actividad de la competencia.

⸻

#### ✅ Criterios de Aceptación

- `POST /competitors` con name, website, industry registra el competidor.
- `GET /competitors` lista todos los competidores del tenant.
- `DELETE /competitors/:id` elimina el competidor.
- `GET /competitors/:id/mentions` devuelve lista de menciones (fuente, contenido, sentimiento, fecha).
- Si el website ya existe para el mismo tenant, retorna 409 (opcional).

⸻

## Epic: EP-012 Dominios personalizados

### 🎯 Objetivo del Epic

Permitir al administrador de tenant configurar un dominio personalizado (CNAME) con verificación DNS y emisión automática de certificado SSL (Let's Encrypt). El dashboard se sirve bajo el dominio del cliente.

⸻

### ✅ Criterios de Éxito

- El usuario puede agregar un dominio, recibir el valor CNAME y token de verificación.
- La verificación DNS comprueba el registro TXT con el token.
- Una vez verificado, se emite certificado SSL automáticamente.
- El dominio se marca como activo y se sirve el dashboard.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `POST /domains`, `GET /domains`, `GET /domains/:id`, `DELETE /domains/:id`, `POST /domains/:id/verify-dns`.
- Tablas: `custom_domains`, `dns_verifications`.
- Integración con Let's Encrypt (ACME).

**Fuera de alcance:**
- Múltiples dominios por tenant (se asume uno).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- La verificación DNS puede fallar si el usuario no configura correctamente el registro.
- La emisión de SSL puede fallar si el dominio no es accesible.

**Suposiciones:**
- El proveedor DNS soporta registros CNAME y TXT.

⸻

### Historia de usuario: US-026 Configuración de dominio personalizado

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Configurar un dominio personalizado para mi dashboard  
**Para:** Que mis clientes me vean con mi propia marca (whitelabel).

⸻

#### ✅ Criterios de Aceptación

- `POST /domains` con el dominio deseado retorna valor CNAME y token de verificación.
- `POST /domains/:id/verify-dns` verifica que el registro TXT con el token exista.
- Si la verificación es exitosa, `verification_status` pasa a `verified` y se inicia emisión SSL.
- Una vez SSL emitido, `ssl_status` pasa a `ready` y `is_active=true`.
- Si la verificación falla, retorna 422 y el usuario puede reintentar.
- `DELETE /domains/:id` elimina el dominio.

⸻

### Tarea técnica: T-010 Implementar integración con Let's Encrypt para SSL automático

#### 🎯 Objetivo técnico

Crear un worker que, tras la verificación DNS, solicite un certificado SSL a Let's Encrypt usando ACME, configure el proxy inverso (Dokploy/Nginx) y actualice `custom_domains.ssl_status`.

⸻

#### 📎 Contexto y relación funcional

### Relacionado con US-026. Afecta a la infraestructura y al módulo `domains`.

⸻

#### ✅ Done Criteria / Validación técnica

- Dominio verificado → solicitud ACME exitosa → certificado emitido.
- El dashboard se sirve bajo HTTPS con el certificado.
- En caso de fallo, se registra en `ssl_status` como `failed`.

⸻

## Epic: EP-013 Informes y reportes

### 🎯 Objetivo del Epic

Permitir al administrador de tenant solicitar reportes generados por IA (rendimiento de campañas, analítica de leads) y visualizarlos.

⸻

### ✅ Criterios de Éxito

- El usuario puede solicitar un reporte por tipo y config.
- La IA genera los datos del reporte asíncronamente.
- El usuario puede listar y ver reportes.

⸻

### 🧱 Alcance

**Incluye:**
- Endpoints: `POST /reports`, `GET /reports`, `GET /reports/:id`.
- Tablas: `reports`.
- Worker de generación IA.

**Fuera de alcance:**
- Gráficos interactivos (frontend).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- La generación de reportes puede ser lenta si hay muchos datos.

**Suposiciones:**
- Los reportes se almacenan como JSON en `data`.

⸻

### Historia de usuario: US-027 Solicitud y visualización de reportes generados por IA

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Solicitar un reporte de rendimiento de campañas o analítica de leads generado por IA  
**Para:** Tomar decisiones basadas en datos.

⸻

#### ✅ Criterios de Aceptación

- `POST /reports` con type ('campaign_performance', 'lead_analytics') y config (fechas, métricas) crea reporte en `draft` y encola generación IA.
- `GET /reports` lista reportes con estado y tipo.
- `GET /reports/:id` muestra el JSON de datos del reporte si está `completed`.
- Si el tipo no es soportado, retorna 400.
- Si la generación falla, el reporte queda en `draft` con error.

⸻

## Epic: EP-014 Seguridad y auditoría

### 🎯 Objetivo del Epic

Implementar registros de auditoría y eventos de seguridad, políticas de protección de marcas en prompts de IA, y aseguramiento de aislamiento multi-tenant.

⸻

### ✅ Criterios de Éxito

- Todas las operaciones relevantes se registran en `audit_logs`.
- Eventos de seguridad críticos se registran en `security_events`.
- Los prompts de agentes Copywriter y Visual incluyen restricciones de marcas registradas.
- El middleware de tenant asegura que todas las consultas filtran por `tenant_id`.
- El superadmin no puede eliminar el último superadmin.

⸻

### 🧱 Alcance

**Incluye:**
- Configuración de logs append-only.
- Protección de marcas en prompts.
- Middleware de aislamiento multi-tenant.
- Validación de eliminación de último superadmin.

**Fuera de alcance:**
- Cifrado a nivel de columna (ya cubierto por BD TDE).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Logs de auditoría pueden crecer rápidamente; se necesita política de retención de 90 días y worker de limpieza.

**Suposiciones:**
- El middleware de tenant se implementa como un NestJS guard personalizado.

⸻

### Historia de usuario: US-028 Protección de marcas en contenido generado por IA

#### 🧾 Historia de Usuario

**Como:** Administrador de tenant  
**Quiero:** Que la IA no mencione marcas registradas competidoras en el contenido que genera para mi empresa  
**Para:** Evitar problemas legales y proteger la imagen de mi marca.

⸻

#### ✅ Criterios de Aceptación

- Los prompts del sistema de los agentes copywriter y visual incluyen restricciones explícitas de no mencionar marcas registradas.
- El tenant puede configurar una lista de marcas prohibidas en su perfil de empresa (opcional, no hay endpoint específico en API, pero se puede añadir a `company_profiles.brand_voice`).
- Si la IA genera contenido que infringe, el sistema lo detecta y bloquea (futuro, en MVP solo restricción en prompt).

⸻

#### 🛠️ Notas Técnicas *(opcional)*

- Las restricciones se añaden al `model_config` del agente correspondiente.
- Se asume que el tenant puede actualizar la lista a través de `PATCH /company-profile`.

⸻

### Tarea técnica: T-011 Implementar middleware de aislamiento multi-tenant

#### 🎯 Objetivo técnico

Crear un guard NestJS que extraiga `tenant_id` del JWT y lo inyecte en el contexto de la petición. Todos los repositorios deben usarlo obligatoriamente en las consultas SQL.

⸻

#### 📎 Contexto y relación funcional

Afecta a todos los módulos con datos de tenant. Derivado del MDD §2.2, §6 (Aislamiento Multi-tenant).

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Crear `TenantGuard` que valida que el usuario autenticado tenga `tenant_id` (excepto superadmin).
2. Inyectar `tenant_id` en el request context.
3. Todos los `find`, `create`, `update` en repositorios filtran por `tenant_id`.
4. Para superadmin, no filtran pero solo pueden acceder mediante impersonalización.

⸻

#### ✅ Done Criteria / Validación técnica

- Un usuario de tenant A no puede ver datos del tenant B (prueba automatizada).
- El superadmin puede ver todos los tenants solo desde endpoints específicos.

⸻

### Tarea técnica: T-012 Implementar validación de no eliminación del último superadmin

#### 🎯 Objetivo técnico

En el comando `DeleteUserCommand`, validar que no se esté eliminando el último superadmin del sistema.

⸻

#### 📎 Contexto y relación funcional

Derivado del MDD §5.6 (regla de negocio 6) y §6 (Super Admin y Bootstrap). Relacionado con US-005 y US-008.

⸻

#### ✅ Done Criteria / Validación técnica

- Si hay solo un superadmin y se intenta eliminar, retorna 409.
- Si hay más de un superadmin, se permite eliminar.
- Prueba de integración cubre ambos casos.

⸻

### Tarea técnica: T-013 Implementar limpieza programada de sesiones expiradas y logs antiguos

#### 🎯 Objetivo técnico

Crear un worker programado (cron) que elimine registros de `sessions` con `expires_at < NOW()` y registros de `audit_logs` y `security_events` más antiguos que 90 días.

⸻

#### 📎 Contexto y relación funcional

Derivado del MDD §6 (Gestión de Sesiones, Logs de Auditoría). Afecta a las tablas `sessions`, `audit_logs`, `security_events`.

⸻

#### ✅ Done Criteria / Validación técnica

- Sesiones expiradas se limpian diariamente.
- Logs más antiguos de 90 días se eliminan.
- Se registra un evento de auditoría de la limpieza.

⸻

## Epic: EP-015 Infraestructura y patrones técnicos

### 🎯 Objetivo del Epic

Implementar los patrones arquitectónicos definidos como SSOT: Arquitectura Hexagonal, Monolito Modular, CQRS, Event Sourcing, Outbox Pattern, Adapter, Facade, Command, Observer/Pub-Sub, State, Strategy, Repository.

⸻

### ✅ Criterios de Éxito

- La estructura de módulos sigue el Monolito Modular con módulos por dominio de negocio.
- Cada mutación se maneja mediante CommandBus; las lecturas mediante QueryBus.
- Los eventos de dominio se persisten en la tabla `events` (Event Sourcing) y se publican mediante Outbox Pattern.
- Los adaptadores para APIs externas implementan puertos definidos en aplicación.
- Los patrones de comportamiento (State, Strategy) se aplican donde el MDD lo sugiere (estados de campaña, scoring).

⸻

### 🧱 Alcance

**Incluye:**
- Estructura de carpetas `modules/<module>/` con subcarpetas `domain`, `application`, `infrastructure`.
- Implementación de Command y Query buses.
- Configuración de tabla `events` y `outbox`.
- Worker que publica eventos de outbox a Redis/BullMQ.
- Adaptadores para APIs IA (TokenLab, OpenRouter, Replicate, ElevenLabs).
- Implementación de State machine para campañas y contenidos.
- Implementación de Strategy para scoring de leads y generación de estrategia.

**Fuera de alcance:**
- Cambios en infraestructura de despliegue (Docker Compose, Dokploy).

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- La complejidad de Event Sourcing puede aumentar el tiempo de desarrollo; se justifica por trazabilidad requerida.

**Suposiciones:**
- Los patrones se implementarán en los módulos que los requieran, no como capa transversal.

⸻

### Tarea técnica: T-014 Implementar estructura de Monolito Modular con módulos de negocio

#### 🎯 Objetivo técnico

Crear la estructura de carpetas del proyecto NestJS siguiendo el Monolito Modular. Cada módulo de negocio tendrá su propia carpeta con submódulos `domain`, `application`, `infrastructure`.

⸻

#### 📎 Contexto y relación funcional

### Derivado del MDD §2.2. Afecta a la organización del código base.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Crear directorio `modules/` con subdirectorios por cada módulo listado en MDD §2.2.
2. Cada módulo exporta un módulo NestJS.
3. El kernel compartido (`shared/`) contiene value objects, utilidades y base classes.
4. Configurar inyección de dependencias para respetar las capas (dominio no depende de infraestructura).

⸻

#### ✅ Done Criteria / Validación técnica

- NestJS puede cargar todos los módulos.
- Las dependencias entre módulos solo son mediante interfaces (puertos).

⸻

### Tarea técnica: T-015 Implementar CQRS con Command y Query buses

#### 🎯 Objetivo técnico

Configurar CommandBus y QueryBus en NestJS usando el patrón Command. Cada mutación se encapsula en un comando manejado por un handler; cada lectura se resuelve con un query.

⸻

#### 📎 Contexto y relación funcional

### Derivado del MDD §2.3. Afecta a toda la capa de aplicación.

⸻

#### ✅ Done Criteria / Validación técnica

- Comandos como `CreateCampaignCommand`, `ApproveContentCommand` son manejados por sus respectivos handlers.
- Queries como `GetCalendarQuery`, `GetLeadPipelineQuery` son manejados por sus handlers.
- No hay lógica de negocio en los controladores HTTP.

⸻

### Tarea técnica: T-016 Implementar Event Sourcing y Outbox Pattern

#### 🎯 Objetivo técnico

Crear las tablas `events` (append-only) y `outbox` para Event Sourcing y publicación confiable de eventos. Implementar un worker que publique eventos de outbox a Redis/BullMQ.

⸻

#### 📎 Contexto y relación funcional

Derivado del MDD §2.3. Afecta a los módulos que persisten eventos de dominio (ej. `content`, `campaign`, `crm`).

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. En cada comando de mutación, escribir evento en `events` con `aggregate_type`, `aggregate_id`, `version`, `event_type`, `data`.
2. En la misma transacción, escribir en `outbox` un registro con `aggregate_type`, `aggregate_id`, `event_type`, `payload`.
3. Worker BullMQ lee `outbox` con status `pending`, envía el evento al bus correspondiente, y actualiza `status` a `processed`.
4. Si falla, reintenta con backoff exponencial.

⸻

#### ✅ Done Criteria / Validación técnica

- Los eventos se persisten en `events` en cada mutación.
- El outbox se vacía correctamente.
- Si el worker falla, los eventos quedan como `failed` y se pueden reintentar.

⸻

### Tarea técnica: T-017 Implementar adaptadores para APIs externas de IA con patrón Adapter y Strategy

#### 🎯 Objetivo técnico

Crear puertos (interfaces) para los servicios de IA: generación de texto (OpenRouter, TokenLab), generación de imágenes (Replicate), voice (ElevenLabs). Implementar adaptadores concretos e intercambiables mediante Strategy.

⸻

#### 📎 Contexto y relación funcional

### Derivado del MDD §7.1 y §7.3. Afecta al módulo `ai-agents`.

⸻

#### 🚧 Pasos técnicos sugeridos *(si aplica)*

1. Definir interfaz `IAiTextProvider`, `IAiImageProvider`, `IAiVoiceProvider`.
2. Implementar adaptadores concretos para cada proveedor.
3. Usar Strategy Pattern para elegir el proveedor según disponibilidad o configuración.
4. Implementar Circuit Breaker en cada adaptador.

⸻

#### ✅ Done Criteria / Validación técnica

- Los adaptadores pueden ser intercambiados sin cambiar la lógica de negocio.
- El Circuit Breaker se abre tras 5 fallos consecutivos.
- Pruebas con proveedores mock.

⸻

### Tarea técnica: T-018 Implementar máquina de estados (State Pattern) para campañas y contenidos

#### 🎯 Objetivo técnico

Implementar State Pattern para gestionar los estados de campañas (`draft → active → paused → completed`) y contenidos (`draft → approved → in_changes`, etc.).

⸻

#### 📎 Contexto y relación funcional

Derivado del MDD §5.2 (flujo de aprobación) y §UI/UX Design Intent (lifecycles). Afecta a los módulos `campaign` y `content`.

⸻

#### ✅ Done Criteria / Validación técnica

- Las transiciones de estado se validan en el dominio.
- No se permiten transiciones inválidas (ej. de `draft` a `completed` sin pasar por `active`).
- Cada transición registra un evento de dominio.

⸻

### Tarea técnica: T-019 Implementar repositorios con patrón Repository para todas las entidades

#### 🎯 Objetivo técnico

Implementar interfaces `IRepository<T>` en la capa de aplicación y adaptadores concretos en infraestructura (TypeORM). Todas las consultas multi-tenant deben filtrar por `tenant_id`.

⸻

#### 📎 Contexto y relación funcional

### Derivado del MDD §2.2 y §6 (Aislamiento Multi-tenant). Afecta a todos los módulos.

⸻

#### ✅ Done Criteria / Validación técnica

- Cada entidad tiene un repositorio que implementa la interfaz definida en aplicación.
- Los métodos `findAll`, `findOne`, `create`, `update` filtran por `tenant_id`.
- Las pruebas de integración verifican aislamiento.

⸻

## Matriz de trazabilidad

| Origen (capacidad/UAT/actor/API)                                          | Epic                                                                                           | US/T                                                | Estado   |
| :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :------- |
| Capacidad: Bootstrap y superadmin                                         | EP-001                                                                                         | US-001                                              | Cubierto |
| Capacidad: Autenticación (login, refresh, logout)                         | EP-001                                                                                         | US-002, US-003, US-004                              | Cubierto |
| Capacidad: Administración multi-tenant (superadmin)                       | EP-002                                                                                         | US-005                                              | Cubierto |
| Capacidad: Impersonalización auditada                                     | EP-002                                                                                         | US-006                                              | Cubierto |
| Capacidad: Logs de auditoría y seguridad                                  | EP-002                                                                                         | US-007                                              | Cubierto |
| Capacidad: Invalidación de sesiones                                       | EP-002                                                                                         | US-008                                              | Cubierto |
| Capacidad: Onboarding progresivo asistido por IA                          | EP-003                                                                                         | US-009                                              | Cubierto |
| Capacidad: Creación de campañas multicanal con IA                         | EP-004                                                                                         | US-010, US-011, US-012                              | Cubierto |
| Capacidad: Gestión de contenido con versionado                            | EP-005                                                                                         | US-013, US-014                                      | Cubierto |
| Capacidad: Aprobación digital (Kill Switch)                               | EP-006                                                                                         | US-015, US-016                                      | Cubierto |
| Capacidad: Calendario Editorial Dinámico                                  | EP-007                                                                                         | US-017, US-018                                      | Cubierto |
| Capacidad: CRM (captura leads y scoring IA)                               | EP-008                                                                                         | US-019, US-020, US-021                              | Cubierto |
| Capacidad: Librería de activos multimedia                                 | EP-009                                                                                         | US-022, US-023                                      | Cubierto |
| Capacidad: Propuestas comerciales generadas por IA                        | EP-010                                                                                         | US-024                                              | Cubierto |
| Capacidad: Monitoreo de competencia                                       | EP-011                                                                                         | US-025                                              | Cubierto |
| Capacidad: Dominio personalizado (CNAME, SSL)                             | EP-012                                                                                         | US-026                                              | Cubierto |
| Capacidad: Informes y reportes                                            | EP-013                                                                                         | US-027                                              | Cubierto |
| Capacidad: Protección de marcas en IA                                     | EP-014                                                                                         | US-028                                              | Cubierto |
| UAT 1: Creación de campaña multicanal completa                            | EP-004                                                                                         | US-010, US-011, US-012                              | Cubierto |
| UAT 2: Flujo de aprobación en Calendario Editorial                        | EP-006, EP-007                                                                                 | US-015, US-017, US-018                              | Cubierto |
| UAT 3: CRM captura lead desde formulario                                  | EP-008                                                                                         | US-020                                              | Cubierto |
| UAT 4: Onboarding progresivo guarda estado                                | EP-003                                                                                         | US-009                                              | Cubierto |
| UAT 5: Impersonalización auditada                                         | EP-002                                                                                         | US-006                                              | Cubierto |
| UAT 6: Versionado inmutable y reversión                                   | EP-005                                                                                         | US-013, US-014                                      | Cubierto |
| UAT 7: Protección contra eliminación de activos en uso                    | EP-009                                                                                         | US-022 (AC4)                                        | Cubierto |
| UAT 8: Bloqueo de cuenta por intentos fallidos                            | EP-001                                                                                         | US-002 (AC2-4)                                      | Cubierto |
| UAT 9: Rotación de refresh token y detección de robo                      | EP-001                                                                                         | US-003 (AC2-3)                                      | Cubierto |
| Actor: Superadmin                                                         | EP-001, EP-002                                                                                 | US-001, US-005, US-006, US-007, US-008              | Cubierto |
| Actor: Administrador de tenant                                            | EP-003, EP-004, EP-005, EP-006, EP-007, EP-008, EP-009, EP-010, EP-011, EP-012, EP-013, EP-014 | US-009 a US-028                                     | Cubierto |
| Actor: Visitante (form submit)                                            | EP-008                                                                                         | US-020                                              | Cubierto |
| Dominio API: /auth, /setup, /health                                       | EP-001                                                                                         | US-001, US-002, US-003, US-004, T-001, T-002, T-003 | Cubierto |
| Dominio API: /tenants, /superadmin, /audit-logs, /security-events, /admin | EP-002                                                                                         | US-005, US-006, US-007, US-008, T-004               | Cubierto |
| Dominio API: /company-profile                                             | EP-003                                                                                         | US-009                                              | Cubierto |
| Dominio API: /campaigns, /budgets, /campaign-templates                    | EP-004                                                                                         | US-010, US-011, US-012, T-005                       | Cubierto |
| Dominio API: /contents, /versions                                         | EP-005, EP-006                                                                                 | US-013, US-014, US-015, US-016, T-006, T-007        | Cubierto |
| Dominio API: /calendar                                                    | EP-007                                                                                         | US-017, US-018                                      | Cubierto |
| Dominio API: /forms, /leads                                               | EP-008                                                                                         | US-019, US-020, US-021, T-008                       | Cubierto |
| Dominio API: /assets, /asset-folders                                      | EP-009                                                                                         | US-022, US-023, T-009                               | Cubierto |
| Dominio API: /proposals                                                   | EP-010                                                                                         | US-024                                              | Cubierto |
| Dominio API: /competitors                                                 | EP-011                                                                                         | US-025                                              | Cubierto |
| Dominio API: /domains                                                     | EP-012                                                                                         | US-026, T-010                                       | Cubierto |
| Dominio API: /reports                                                     | EP-013                                                                                         | US-027                                              | Cubierto |
| Regla de negocio: Kill Switch obligatorio                                 | EP-006                                                                                         | US-015, US-016, T-007                               | Cubierto |
| Regla de negocio: Inmutabilidad post-firma                                | EP-005, EP-006                                                                                 | US-013, US-015, T-006                               | Cubierto |
| Regla de negocio: Rotación de refresh token                               | EP-001                                                                                         | US-003, T-002                                       | Cubierto |
| Regla de negocio: Bloqueo por intentos fallidos                           | EP-001                                                                                         | US-002, T-003                                       | Cubierto |
| Regla de negocio: Aislamiento multi-tenant                                | EP-014                                                                                         | T-011                                               | Cubierto |
| Regla de negocio: Superadmin mínimo                                       | EP-014                                                                                         | T-012                                               | Cubierto |
| Regla de negocio: Score de lead (IA)                                      | EP-008                                                                                         | T-008                                               | Cubierto |
| Regla de negocio: Onboarding progresivo (≥80%)                            | EP-003                                                                                         | US-009                                              | Cubierto |
| Regla de negocio: Eliminación de assets en uso                            | EP-009                                                                                         | US-022 (AC4)                                        | Cubierto |
| Patrón: Arquitectura Hexagonal                                            | EP-015                                                                                         | T-014, T-017                                        | Cubierto |
| Patrón: Monolito Modular                                                  | EP-015                                                                                         | T-014                                               | Cubierto |
| Patrón: CQRS                                                              | EP-015                                                                                         | T-015                                               | Cubierto |
| Patrón: Adapter                                                           | EP-015                                                                                         | T-017                                               | Cubierto |
| Patrón: Facade                                                            | EP-015                                                                                         | Cubierto (implícito en módulos)                     |          |
| Patrón: Command                                                           | EP-015                                                                                         | T-015                                               | Cubierto |
| Patrón: Observer / Pub-Sub                                                | EP-015                                                                                         | T-016                                               | Cubierto |
| Patrón: State                                                             | EP-015                                                                                         | T-018                                               | Cubierto |
| Patrón: Strategy                                                          | EP-015                                                                                         | T-017, T-008                                        | Cubierto |
| Patrón: Repository                                                        | EP-015                                                                                         | T-019                                               | Cubierto |
| Patrón: Outbox Pattern                                                    | EP-015                                                                                         | T-016                                               | Cubierto |
| Patrón: Event Sourcing                                                    | EP-015                                                                                         | T-016                                               | Cubierto |

## Registro de cambios del documento

| Versión | Fecha     | Descripción del cambio                                                                                                                                                                                                                                              |
| :------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | Mayo 2026 | Creación inicial del backlog completo de AgenteIA: 15 epics, 27 historias de usuario y 19 tareas técnicas. Cobertura exhaustiva de capacidades MVP, actores, UAT, dominios API, reglas de negocio y patrones arquitectónicos SSOT. Matriz de trazabilidad incluida. |