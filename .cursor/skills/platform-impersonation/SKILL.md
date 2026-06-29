---
name: platform-impersonation
description: >-
  Implementa impersonación de tenant para superadmin/plataforma con el patrón
  Kreo Eventos: solo tenantId, usuario proxy automático, sesión de plataforma
  en localStorage, selector en header y salida sin API. Usar cuando el usuario
  pida impersonación, impersonation, suplantación, act as tenant, entrar como
  tenant, switch de tenant desde consola, o replantear auth multi-tenant de
  plataforma.
---

# Impersonación de plataforma (patrón Kreo Eventos)

Referencia canónica: `eodin` (Kreo Eventos) y `mkt-agency` (monolito).

**Leer esta skill completa antes de implementar.** No improvisar modales de usuario, banners ni `DELETE` para salir.

## Principios (obligatorios)

1. **Entrada solo por tenant** — el cliente envía `{ tenantId }`. Nunca pedir al superadmin que elija un usuario del tenant.
2. **Usuario proxy en backend** — resolver owner → admin → primer activo (`findTenantProxyUser`).
3. **Dos sesiones separadas** — JWT activo = tenant impersonado; sesión de plataforma guardada aparte en `localStorage` (`{app}_impersonation`).
4. **Salida local** — restaurar JWT de plataforma desde `localStorage`. No depender de `DELETE /impersonate` para UX.
5. **UI = selectores en header** — no banner amarillo ni modal de confirmación largo.
6. **Cambio de tenant** — re-llamar impersonate con **token de plataforma** (`apiFetchAsPlatform`), no con JWT impersonado.
7. **Guard de tenant** — operativa tenant exige `tenantId` y, si es superadmin nativo, `impersonating: true` en JWT.

## Decisión de arquitectura

| Escenario | Patrón |
|-----------|--------|
| Admin y app tenant **misma SPA** | `lib/impersonation.ts` + selectores en shell (mkt-agency) |
| Admin y app tenant **apps separadas** | Handoff URL `#token=...&platformToken=...` → `/auth/impersonate` (eodin) |

Si el repo ya tiene admin separado, seguir eodin. Si es monolito modular, seguir mkt-agency.

## Checklist de implementación

Copiar y marcar al implementar:

```
Impersonación Kreo Eventos:
- [ ] Backend: POST impersonate solo tenantId + proxy user
- [ ] Backend: JWT impersonado (sub=proxy, email=superadmin, impersonating, superadminId)
- [ ] Backend: TenantGuard bloquea superadmin sin impersonating
- [ ] Backend: audit log en inicio (opcional fin vía API aparte)
- [ ] Frontend: lib/impersonation.ts (save/read/clear context, apply, exit)
- [ ] Frontend: apiFetchAsPlatform() para list tenants / re-impersonate
- [ ] Frontend: TenantImpersonationSelect (consola superadmin)
- [ ] Frontend: ImpersonationSwitcher (durante impersonación)
- [ ] Frontend: 401 en impersonación → exitImpersonation(), no refresh del proxy
- [ ] README de carpetas tocadas
- [ ] Sin modal de selección de usuario
- [ ] Sin banner IMPERSONANDO como única salida
```

## Backend mínimo

Ver contrato y handler en [reference.md](reference.md).

Resumen:

- `POST /platform/tenants/:id/impersonate` o `POST /superadmin/impersonate` con `{ tenantId }`
- Respuesta: `accessToken`/`impersonationToken`, `tenant`, `user` (con `role`)
- Proxy: `owner` > `admin` > otros activos, excluir superadmins
- Claims JWT: `sub` = proxy, `email` = superadmin, `impersonating: true`, `superadminId`

## Frontend mínimo

Archivo central `{app}/lib/impersonation.ts`:

| Función | Rol |
|---------|-----|
| `saveImpersonationContext` | Guardar tokens + user plataforma al **primer** enter |
| `readImpersonationContext` / `isImpersonating` | Detectar modo impersonación |
| `getPlatformAccessToken` | Authorization para APIs de plataforma mientras impersonas |
| `applyImpersonationSession` | Intercambiar a JWT tenant |
| `exitImpersonation` | Restaurar plataforma y redirigir a consola |

Selectores (nombres estándar):

- **`TenantImpersonationSelect`** — visible si superadmin y **no** impersonando. Opción fija «Consola superadmin» + lista de tenants.
- **`ImpersonationSwitcher`** — visible si `isImpersonating()`. Misma lista; «Consola superadmin» llama `exitImpersonation()`.

Constante de UI: `CONSOLE_VALUE = '__console__'`.

## Anti-patrones (no implementar)

- Modal para elegir usuario del tenant
- Guardar sesión superadmin mezclada en el mismo store sin clave separada
- Salir de impersonación solo vía API que emite nuevo JWT superadmin
- Listar tenants con JWT impersonado (fallará SuperadminGuard)
- Permitir superadmin nativo en rutas tenant sin `impersonating`
- Banner como único control de salida

## Variante apps separadas

Si admin ≠ tenant app:

1. Admin llama impersonate y redirige: `{tenantWeb}/auth/impersonate#token=...&platformToken=...&platformUser=...`
2. Tenant app parsea hash en `applyImpersonationHandoff`
3. Salida: `redirectToPlatformAdmin` con token guardado

Detalle en [examples.md](examples.md).

## Referencias en repos Kreo

| Repo | Qué copiar |
|------|------------|
| `eodin/apps/web/src/lib/impersonation.ts` | Handoff + context |
| `eodin/apps/admin/src/lib/tenant-impersonation.ts` | Redirect con hash |
| `eodin/apps/api/.../platform-impersonation.service.ts` | Proxy user |
| `mkt-agency/apps/web/src/lib/impersonation.ts` | Monolito |
| `mkt-agency/apps/web/src/components/admin/*Impersonation*` | Selectores |

## Al terminar

1. Actualizar README de módulos/carpetas modificados.
2. Mensaje de commit imperativo: qué patrón se aplicó y qué se eliminó (modal/banner/API exit).
