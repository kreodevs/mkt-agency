# Company profile module

Onboarding progresivo del tenant: `/api/v1/company-profile` y `/sections`.

- `PATCH /company-profile` bloquea edición si `status === completed`; Brand Analyst usa `mergeFromBrandBrief` para fusionar campos del brief.
- Evento `CompanyProfileCompleted` en tabla `outbox` (misma transacción).
- `POST /sections/:key/suggest` → 202 + `assignmentId`; cola BullMQ `section-suggestion`; polling `GET /suggestions/:id`.
- Cada `PATCH /sections/:key` sincroniza campos planos en `company_profiles` vía `ProfileSectionSyncService`.

## Frontend (Kreo)

Wizard: `Wizard` + `DynamicForm` MCP Kreo para cuestionario por sección.
