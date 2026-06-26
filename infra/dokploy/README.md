# Despliegue en Dokploy

Stack de producción: **`docker-compose.dokploy.yml`** (Compose Type en Dokploy).

Desarrollo local: **`docker-compose.yml`**.

## 1. Crear proyecto Compose en Dokploy

1. **Projects** → nuevo proyecto → entorno (ej. `production`).
2. **Create Service** → **Compose**.
3. Conectar repositorio Git (`kreodevs/mkt-agency`).
4. **Compose file path:** `docker-compose.dokploy.yml`
5. **Build context:** raíz del repo (`.`).

## 2. Variables de entorno

Copiar desde `.env.example` y definir en Dokploy → **Environment**:

| Variable | Notas |
|----------|--------|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Credenciales PostgreSQL del stack |
| `JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM` | RSA PEM (una línea con `\n`) |
| `S3_*` | MinIO interno o DO Spaces en prod |
| `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` | OpenRouter / proveedor IA |
| `CORS_ORIGIN` | Origen del frontend (dominio público) |
| `API_PUBLIC_URL` | URL pública API, ej. `https://app.example.com/api/v1` |
| `LOG_LEVEL` | `info` en prod |

## 3. Dominio (recomendado: UI Domains)

1. Servicio **frontend** → pestaña **Domains**.
2. Añadir dominio (ej. `app.tudominio.com`).
3. Puerto interno: **80**.
4. HTTPS: Let's Encrypt (Dokploy inyecta labels Traefik).

El nginx del frontend hace proxy de `/api/` al servicio `api:3000` en la red `internal`.

> Si configuras dominio manual con labels, mantén `traefik.docker.network=dokploy-network`.

## 4. Migraciones (primera vez)

Tras el primer deploy con postgres healthy:

```bash
# En el contenedor api (Dokploy → Terminal)
cd apps/backend && yarn migration:run
```

O ejecutar localmente apuntando al Postgres del VPS.

## 5. Volúmenes

Persistencia gestionada por Dokploy:

- `pgdata` — PostgreSQL
- `redisdata` — Redis AOF
- `miniodata` — MinIO (solo si no usas S3 externo)

Programar backups de `pgdata` desde Dokploy → Volume Backups.

## 6. Servicios expuestos

| Servicio | Red pública | Acceso |
|----------|-------------|--------|
| frontend | `dokploy-network` | Dominio Traefik |
| api | solo `internal` | vía nginx `/api` |
| postgres, redis, minio, worker | solo `internal` | no exponer |

## 7. Worker

`worker` comparte imagen con `api` (procesadores BullMQ en el monolito). En despliegues pequeños puedes escalar solo `api`; mantener `worker` si quieres separar carga HTTP de jobs (ambos consumen la misma cola).

## 8. Healthchecks

- API: `GET /api/v1/setup/status` cada 30s (MDD §7).
- Dokploy reinicia tras fallos consecutivos según política del servidor.

## 9. CI → Dokploy

GitHub Actions (`.github/workflows/ci.yml`) valida `yarn build`. Configura webhook de deploy en Dokploy al push en `main`.
