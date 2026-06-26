# Onboarding company-profile (US-007)

Ruta `/onboarding` — solo usuarios con `tenantId` (`TenantGuard`).

## Flujo

1. Carga perfil + secciones (`GET /company-profile`, `/sections`)
2. Wizard de 8 pasos con Kreo `Stepper`, `Progress`, `InputText`, `Textarea`
3. Cada paso guarda con `PATCH /company-profile/sections/:key`
4. Al ≥80% el backend activa el perfil (`status: completed`)

## Config

Campos por sección en `src/config/onboarding-sections.ts`.
