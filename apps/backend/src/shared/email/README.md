# Email (owner notifications)

Puerto hexagonal para notificaciones al dueño del tenant (E-A1).

| Adaptador | Cuándo |
|-----------|--------|
| `ConsoleEmailAdapter` | Sin `SMTP_HOST` (dev) |
| `SmtpEmailAdapter` | `SMTP_HOST` configurado |

Variables: `SMTP_*`, `FRONTEND_PUBLIC_URL` (enlaces en emails; fallback `CORS_ORIGIN` si no es `*`).

Consumido por `OwnerNotificationService` en `publication-inbox`.
