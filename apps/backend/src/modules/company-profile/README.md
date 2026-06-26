# Company profile module

Onboarding progresivo del tenant: `/api/v1/company-profile` y `/sections`.

- 5 secciones obligatorias → `completion_percentage` (80% activa perfil).
- Evento `CompanyProfileCompleted` en tabla `outbox` (misma transacción).

## Frontend (Kreo)

Wizard: `Wizard` + `DynamicForm` MCP Kreo para cuestionario por sección.
