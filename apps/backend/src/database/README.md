# Migraciones TypeORM

En **desarrollo**, `synchronize: true` crea/actualiza el esquema automáticamente.

En **producción**, ejecutar migraciones antes del deploy:

```bash
cd apps/backend
yarn migration:run
```

## Archivos

| Migración | Tablas |
|-----------|--------|
| `1730000000001-CreateFormsAndCrm.ts` | `forms`, `form_submissions`, `leads`, `lead_interactions` |
| `1730000000002-CreateAssets.ts` | `assets`, `asset_folders`, `asset_tags`, `asset_tag_assignments` |
| `1730000000003-CreateDomains.ts` | `custom_domains`, `dns_verifications` |
| `1730000000004-CreateProposals.ts` | `proposals` |
| `1730000000005-CreateReports.ts` | `reports` |
| `1730000000006-CreateCompetitors.ts` | `competitors`, `competitor_mentions` |
| `1730000000007-CreateAuditLogs.ts` | `audit_logs` |

DataSource: `src/database/data-source.ts`.

Las tablas core (users, tenants, campaigns, contents, …) se gestionan con `synchronize` en dev hasta una migración baseline dedicada.
