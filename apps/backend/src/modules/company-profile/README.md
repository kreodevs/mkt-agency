# Company profile module

Onboarding progresivo del tenant: `/api/v1/company-profile` y `/sections`.

- 5 secciones obligatorias → `completion_percentage` (80% activa perfil).
- Evento `CompanyProfileCompleted` en tabla `outbox` (misma transacción).
- `POST /sections/:key/suggest` → 202 + `assignmentId`; cola BullMQ `section-suggestion`; polling `GET /suggestions/:id`.

## Frontend (Kreo)

Wizard: `Wizard` + `DynamicForm` MCP Kreo para cuestionario por sección.
