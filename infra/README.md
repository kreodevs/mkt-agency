# Docker / local stack

| Archivo | Uso |
|---------|-----|
| `docker-compose.yml` | Desarrollo local |
| `docker-compose.dokploy.yml` | Producción en Dokploy (ver `infra/dokploy/README.md`) |
| `Dockerfile.api` | Imagen NestJS (build multietapa; incluye **FFmpeg** para concatenar videos segmentados) |
| `Dockerfile.frontend` | Imagen nginx + assets Vite |
| `Dockerfile.redis` | Imagen Redis 7 + entrypoint de cuarentena AOF (sin bind mount en Dokploy) |
| `infra/redis/redis.conf` | Redis sin persistencia (BullMQ / rate-limit) |
| `infra/nginx/frontend.conf` | Proxy `/api` → servicio `api`; timeouts extendidos (180s) en onboarding complete y descubrimiento de competidores |

## Arranque local

```bash
cp .env.example .env
docker compose up --build
```

- Frontend (+ API vía proxy): http://localhost:8080  
- API directa (opcional): http://localhost:3001 (`API_PUBLISH_PORT`, por defecto 3001 para no chocar con Nest en 3000)
- MinIO console: http://localhost:9001

### Puerto 3000 ya en uso

Si ves `Bind for 0.0.0.0:3000 failed: port is already allocated`:

1. **En Dokploy:** cambia el compose path a `docker-compose.dokploy.yml` (no `docker-compose.yml`).
2. **En local:** para el proceso en 3000 (`yarn start:dev`, otro contenedor) o define `API_PUBLISH_PORT=3002` en `.env`.

En producción las migraciones se aplican al arrancar el contenedor `api` (entrypoint en `Dockerfile.api`). El worker no las ejecuta (`RUN_MIGRATIONS=false`).
