# Migraciones TypeORM

En **desarrollo**, `synchronize: true` crea/actualiza el esquema automáticamente.

En **producción (Docker/Dokploy)**, el contenedor `api` ejecuta migraciones al arrancar vía `scripts/docker-api-entrypoint.sh` (`migration:run:prod`). El worker usa `RUN_MIGRATIONS=false`.

Manual (local o contenedor):

```bash
cd apps/backend
yarn migration:run          # desarrollo (TS + ts-node)
yarn migration:run:prod     # compilado (dist/*.js)
```

## Archivos

| Migración | Tablas |
|-----------|--------|
| `1730000000000-CreateCoreTables.ts` | `tenants`, `users`, `sessions`, `security_events`, `impersonation_logs`, perfiles, campañas, contenidos, `events` |
| `1730000000001-CreateFormsAndCrm.ts` | `forms`, `form_submissions`, `leads`, `lead_interactions` |
| `1730000000002-CreateAssets.ts` | `assets`, `asset_folders`, `asset_tags`, `asset_tag_assignments` |
| `1730000000003-CreateDomains.ts` | `custom_domains`, `dns_verifications` |
| `1730000000004-CreateProposals.ts` | `proposals` |
| `1730000000005-CreateReports.ts` | `reports` |
| `1730000000006-CreateCompetitors.ts` | `competitors`, `competitor_mentions` |
| `1730000000007-CreateAuditLogs.ts` | `audit_logs` |
| `1729999999999-UpgradeLegacyUsersSchema.ts` | Añade columnas monorepo en `users` legacy (camelCase → snake_case); corre **antes** del baseline |

DataSource: `src/database/data-source.ts`.

La migración `1730000000000` es la **baseline** para despliegues sin `synchronize`.
