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

- API: http://localhost:3000
- Frontend: http://localhost:8080
- MinIO console: http://localhost:9001

En producción ejecutar migraciones antes del deploy (`yarn workspace @mkt-agency/backend migration:run`).
