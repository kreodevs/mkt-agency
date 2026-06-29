# Ejemplos — impersonación Kreo Eventos

## Monolito (mkt-agency)

### lib/impersonation.ts — apply

```typescript
export function applyImpersonationSession(data: ImpersonateResponse, tenantId: string) {
  const state = useAuthStore.getState();

  if (!readImpersonationContext() && state.user?.isSuperadmin && state.tokens) {
    saveImpersonationContext({
      platformTokens: state.tokens,
      platformUser: state.user,
    });
  }

  useAuthStore.getState().setImpersonationSession(
    { accessToken: data.impersonationToken, refreshToken: state.tokens?.refreshToken ?? '' },
    {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      isSuperadmin: false,
      tenantId,
      impersonating: true,
    },
    data.tenant.name,
  );
}
```

### services/superadmin.ts — impersonate

```typescript
export async function impersonateTenant(tenantId: string) {
  const fetcher = isImpersonating() ? apiFetchAsPlatform : apiFetch;
  const data = await fetcher<ImpersonateResponse>('/superadmin/impersonate', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
  applyImpersonationSession(data, tenantId);
  return data;
}
```

### DashboardShell — header

```tsx
const headerActions = isImpersonating() ? (
  <ImpersonationSwitcher />
) : user?.isSuperadmin ? (
  <TenantImpersonationSelect />
) : null;

<AppLayout headerActions={headerActions} ... />
```

---

## Apps separadas (eodin / Eventos)

### Admin — redirect con hash

```typescript
export function redirectToTenantImpersonation(input: {
  session: TenantImpersonationSession;
  tenantName: string;
  platformToken: string;
  platformUser: PlatformLoginResponse['user'];
}) {
  const hash = new URLSearchParams({
    token: input.session.accessToken,
    user: JSON.stringify(input.session.user),
    tenant: JSON.stringify(input.session.tenant),
    roles: JSON.stringify(input.session.roles),
    permissions: JSON.stringify(input.session.permissions),
    tenantName: input.tenantName,
    platformToken: input.platformToken,
    platformUser: JSON.stringify(input.platformUser),
  });
  window.location.href = `${tenantWebEntryUrl(...)}/auth/impersonate#${hash}`;
}
```

### Tenant app — callback route

```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  applyImpersonationHandoff({
    accessToken: params.get('token')!,
    user: JSON.parse(params.get('user')!),
    tenant: JSON.parse(params.get('tenant')!),
    roles: JSON.parse(params.get('roles')!),
    permissions: JSON.parse(params.get('permissions')!),
    tenantName: params.get('tenantName') ?? '',
    platformToken: params.get('platformToken')!,
    platformUser: JSON.parse(params.get('platformUser')!),
  });
}, []);
```

### Salida — vuelta al admin

```typescript
export function exitImpersonation() {
  const ctx = readImpersonationContext();
  resetAuthSession();
  clearImpersonationContext();
  if (ctx) {
    redirectToPlatformAdmin({
      accessToken: ctx.platformToken,
      user: ctx.platformUser,
    });
  }
}
```

---

## Backend — handler NestJS

```typescript
const proxyUser = await this.users.findTenantProxyUser(command.tenantId);
if (!proxyUser) {
  throw new BadRequestException({
    error: 'El tenant no tiene usuario administrador activo',
    code: 'VALIDATION_ERROR',
  });
}

const { accessToken, expiresIn } = this.jwt.signImpersonationToken({
  sub: proxyUser.id,
  email: command.superadmin.email,
  isSuperadmin: false,
  role: proxyUser.role,
  tenantId: command.tenantId,
  impersonating: true,
  superadminId: command.superadmin.id,
});
```

---

## ImpersonationSwitcher — cambio de tenant

```typescript
onChange={(e) => {
  const value = e.target.value;
  if (value === CONSOLE_VALUE) {
    exitImpersonation();
    return;
  }
  if (value === tenantId) return;
  void impersonateTenant(value).then(() => window.location.replace('/'));
}}
```

---

## Commit message ejemplo

```
Replanta impersonación al estilo Kreo Eventos.

Impersona por tenant con usuario proxy, selector en header y restauración local de sesión superadmin.
```
