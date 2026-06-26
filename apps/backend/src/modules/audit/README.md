# AuditModule

Consulta de logs de auditoría (superadmin) y registro automático vía `@AuditLog`.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/audit-logs` | Superadmin | Listar con filtros `tenantId`, `action`, `from`, `to` |

## Decorador

```typescript
@AuditLog({ action: 'tenant.created', resourceType: 'tenant' })
```

El `AuditLogInterceptor` registra la acción tras respuesta exitosa.

## Retención

Worker BullMQ `audit-retention` — purga logs > 90 días (cron diario 03:00).

## Migration

`1730000000007-CreateAuditLogs.ts`
