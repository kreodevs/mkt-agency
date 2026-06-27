# Scripts

| Script | Uso |
|--------|-----|
| `docker-api-entrypoint.sh` | Entrypoint de `Dockerfile.api`: ejecuta `typeorm migration:run` contra `apps/backend/dist/database/data-source.js` si `RUN_MIGRATIONS=true` (default), luego `exec` del CMD. |

Variables:

- `RUN_MIGRATIONS` — `true` en servicio `api`; `false` en `worker` (ver `docker-compose.dokploy.yml`).
