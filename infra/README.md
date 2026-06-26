# Docker / local stack

| Archivo | Uso |
|---------|-----|
| `docker-compose.yml` | Desarrollo local |
| `docker-compose.dokploy.yml` | Producción en Dokploy (ver `infra/dokploy/README.md`) |
| `Dockerfile.api` | Imagen NestJS (build multietapa) |
| `Dockerfile.frontend` | Imagen nginx + assets Vite |
| `infra/nginx/frontend.conf` | Proxy `/api` → servicio `api` |

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

En producción ejecutar migraciones antes del deploy (`yarn workspace @mkt-agency/backend migration:run`).
