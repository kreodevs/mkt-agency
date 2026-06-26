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

DataSource: `src/database/data-source.ts`.

Las tablas core (users, tenants, campaigns, contents, …) se gestionan con `synchronize` en dev hasta una migración baseline dedicada.
