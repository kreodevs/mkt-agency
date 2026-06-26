# Forms (US-013)

Formularios embebibles por tenant.

## Endpoints

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/v1/forms` | JWT tenant |
| POST | `/api/v1/forms` | JWT tenant |
| GET | `/api/v1/forms/:id` | JWT tenant |
| PATCH | `/api/v1/forms/:id` | JWT tenant |
| DELETE | `/api/v1/forms/:id` | JWT tenant |
| GET | `/api/v1/forms/:id/snippet` | JWT tenant |
| GET | `/api/v1/forms/:id/submissions` | JWT tenant |
| POST | `/api/v1/forms/:id/submit` | Público |

El envío público crea o actualiza un lead por email (sin duplicar). Ver `SubmitFormHandler`.

Variable opcional: `API_PUBLIC_URL` para URLs absolutas en el snippet JS.
