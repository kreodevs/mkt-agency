# Scripts

| Script | Uso |
|--------|-----|
| `docker-api-entrypoint.sh` | Entrypoint de `Dockerfile.api`: ejecuta `typeorm migration:run` contra `apps/backend/dist/database/data-source.js` si `RUN_MIGRATIONS=true` (default), luego `exec` del CMD. |
| `reset-tenant-operational-data.sh` | Local: compila backend y ejecuta migraciones (incluye `0024` reset operativo). |

Variables:

- `RUN_MIGRATIONS` — `true` en servicio `api`; `false` en `worker` (ver `docker-compose.dokploy.yml`).
- `SKIP_OPERATIONAL_DATA_RESET` — `true` omite la migración `0024` (borrado de datos operativos).
