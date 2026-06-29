# Referencia — impersonación Kreo Eventos

## Contrato API

### Request

```http
POST /api/v1/superadmin/impersonate
Authorization: Bearer <platform-jwt>
Content-Type: application/json

{ "tenantId": "uuid" }
```

Solo `tenantId`. Sin `userId`.

### Response

```json
{
  "impersonationToken": "jwt...",
  "expiresIn": 3600,
  "tenant": { "id": "uuid", "name": "Acme" },
  "user": {
    "id": "proxy-user-uuid",
    "name": "admin@kreo.mx (superadmin)",
    "email": "admin@kreo.mx",
    "role": "owner"
  },
  "note": "All actions are logged..."
}
```

TTL impersonación recomendado: 1 h. TTL plataforma: sesión normal.

## JWT impersonado

```typescript
{
  sub: proxyUser.id,           // FK tenant operations
  email: superadmin.email,     // auditoría / UI
  isSuperadmin: false,
  role: proxyUser.role,
  tenantId: tenant.id,
  impersonating: true,
  superadminId: superadmin.id,
}
```

## findTenantProxyUser (SQL lógico)

```sql
WHERE tenant_id = :tenantId
  AND is_superadmin = false
  AND status = 'active'
ORDER BY CASE role
  WHEN 'owner' THEN 0
  WHEN 'admin' THEN 1
  ELSE 2
END,
created_at ASC
LIMIT 1
```

Error si null: `El tenant no tiene usuario administrador activo`.

## TenantGuard (backend)

```typescript
if (!user?.tenantId) throw Forbidden;
if (user.isSuperadmin && !user.impersonating) {
  throw Forbidden('Tenant operations require impersonation for superadmin');
}
```

## localStorage

| Clave | Contenido |
|-------|-----------|
| `{app-slug}_impersonation` | `{ platformTokens, platformUser }` o `{ platformToken, platformUser }` |
| `{app-slug}-auth` | Sesión activa (impersonada o no) — **sin** mezclar tokens plataforma |

`isImpersonating()` = existe entrada en `{app}_impersonation`.

## apiFetchAsPlatform

```typescript
export async function apiFetchAsPlatform<T>(path: string, init?: RequestInit) {
  const token = getPlatformAccessToken() ?? getAccessToken();
  if (!token) throw new ApiError('Sesión de plataforma no disponible', 401);
  return apiFetch<T>(path, init, { accessToken: token });
}
```

Usar para:

- `POST /superadmin/impersonate` al **cambiar** de tenant
- `GET /tenants` desde ImpersonationSwitcher

## Refresh / 401

Si JWT impersonado expira:

```typescript
if (store.user?.impersonating) {
  exitImpersonation(); // restaura plataforma
  return null;
}
```

No refrescar el token impersonado contra `/auth/refresh` del proxy.

## ImpersonationPolicy (opcional)

Bloquear acciones destructivas cuando `user.impersonating === true` (delete tenant, delete user, etc.).

## Audit

Mínimo: log `impersonation_started` con `superadminId`, `tenantId`, `proxyUserId`.

Fin de sesión: opcional vía endpoint separado; **no** bloquear UX de salida.

## Componentes UI

### TenantImpersonationSelect

- Query: tenants activos
- `value` fijo `CONSOLE_VALUE` hasta selección
- `onChange`: si tenantId → `impersonateTenant(id)` → navigate home tenant

### ImpersonationSwitcher

- Solo si `isImpersonating()`
- `onChange`: `CONSOLE_VALUE` → `exitImpersonation()`; otro id → `impersonateTenant` + reload

Estilos: select compacto en header (`headerActions` del shell), no sidebar.

## Navegación plataforma vs tenant

Superadmin nativo: nav solo plataforma (tenants, config IA, usuarios…).

Impersonando: nav operativa tenant (campañas, agentes…).

Detectar nav con `isImpersonating()` o `user.impersonating`.

## Endpoint legacy a deprecar

- `DELETE /superadmin/impersonate` — no usar en frontend para salida
- `userId` en body de impersonate — eliminar
- `GET /superadmin/tenants/:id/users` solo para impersonación — eliminar de UX
