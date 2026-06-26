# Backend — Mkt Agency OS

API NestJS (monolito modular) bajo `apps/backend`.

## Módulos

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| `setup` | `/api/v1/setup` | Bootstrap del primer superadmin |
| `tenant` | `/api/v1/tenants` | CRUD tenants (superadmin, JWT) |
| `auth` | `/api/v1/auth` | Login, refresh, logout, JWKS |
| `superadmin` | `/api/v1/superadmin` | Impersonación auditada |
| `users` | `/api/v1/users` | Perfil autenticado |
| `security` | `/api/v1/security-events` | Eventos de seguridad (SA) |

Ver README por módulo en `src/modules/*/README.md`.

## Endpoints implementados

### `GET /api/v1/setup/status`

Verifica si existe al menos un superadmin (`users.is_superadmin = true`).

**Respuesta 200 (sin superadmin):**

```json
{
  "isConfigured": false,
  "message": "No superadmin configured. Use /setup/init to bootstrap."
}
```

**Respuesta 200 (configurado):**

```json
{
  "isConfigured": true,
  "message": "System ready. Redirect to /auth/login."
}
```

### `POST /api/v1/setup/init`

Crea el primer superadmin. Solo disponible si no existe ninguno (`NoSuperadminExistsGuard` + validación en `CreateSuperadminHandler`).

**Request:**

```json
{
  "email": "admin@agenteia.com",
  "password": "Str0ngP@ssw0rd!",
  "name": "Super Admin"
}
```

**Respuesta 201:**

```json
{
  "id": "uuid",
  "email": "admin@agenteia.com",
  "name": "Super Admin",
  "isSuperadmin": true
}
```

**Respuesta 409:** `{ "error": "Superadmin already exists", "code": "CONFLICT" }`

Contraseña: Argon2id (`memoryCost=65536`, `parallelism=4`) vía `Password` value object.

## Desarrollo

```bash
# Desde la raíz del monorepo
yarn install
yarn workspace @mkt-agency/backend start:dev
```

Variables de entorno: ver `.env.example` en la raíz (`DB_*`).

## Build

```bash
yarn build
```
