# Scripts

| Script | Uso |
|--------|-----|
| `docker-api-entrypoint.sh` | Entrypoint de `Dockerfile.api`: ejecuta `migration:run:prod` si `RUN_MIGRATIONS=true` (default), luego `exec` del CMD (`node apps/backend/dist/main.js`). |

Variables:

- `RUN_MIGRATIONS` — `true` en servicio `api`; `false` en `worker` (ver `docker-compose.dokploy.yml`).
