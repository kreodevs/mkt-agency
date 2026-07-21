# Scripts

| Script | Uso |
|--------|-----|
| `docker-api-entrypoint.sh` | Entrypoint de `Dockerfile.api`: ejecuta `typeorm migration:run` contra `apps/backend/dist/database/data-source.js` si `RUN_MIGRATIONS=true` (default), luego `exec` del CMD. |
| `redis-docker-entrypoint.sh` | Entrypoint del servicio `redis`: cuarentena AOF legacy, repara si `--appendonly yes`, prueba arranque y resetea si falla (`REDIS_AOF_RESET_ON_CORRUPT`, default `true`). |
| `reset-tenant-operational-data.sh` | Local: compila backend y ejecuta migraciones (incluye `0024` reset operativo). |
| `clear-generated-contents.sh` | Borra contenidos generados y competidores (`SKIP_GENERATED_CONTENT_RESET=false` por defecto). Idempotente aunque la migración `0032` ya esté aplicada. |

Variables:

- `RUN_MIGRATIONS` — `true` en servicio `api`; `false` en `worker` (ver `docker-compose.dokploy.yml`).
- `SKIP_OPERATIONAL_DATA_RESET` — `true` omite la migración `0024` (borrado de datos operativos).
- `SKIP_GENERATED_CONTENT_RESET` — `true` omite la limpieza de contenidos (`0032` + CLI idempotente). Default: `false`.
- `RUN_GENERATED_CONTENT_RESET` — `true` en servicio `api` ejecuta la limpieza al arrancar (logs `[entrypoint]`). **Usar solo un deploy** y volver a `false`.
