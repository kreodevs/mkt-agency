# Infraestructura y Despliegue - AgenteIA

## 1. Dockerfile multietapa

Se genera una imagen optimizada para el backend NestJS con dos etapas: compilación y ejecución. Se usa `node:20-alpine` como base ligera, se instala solo dependencias de producción y se ejecuta con usuario no root.

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

COPY . .
RUN yarn build

# ---- Runtime Stage ----
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]

```
## 2. docker-compose.yml

```yaml
version: "3.9"
services:
postgres:
    image: postgres:16-alpine
    container_name: agenteia-postgres
    env_file: .env
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
  redis:
    image: redis:7-alpine
    container_name: agenteia-redis
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    image: minio/minio:latest
    container_name: agenteia-minio
    env_file: .env
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    volumes:
      - miniodata:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
  api:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: agenteia-api
    env_file: .env
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
  postgres:
        condition: service_healthy
  redis:
        condition: service_healthy
        condition: service_healthy
    volumes:
      - ./apps/backend/src:/app/src
  worker:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: agenteia-worker
    env_file: .env
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      NODE_ENV: development
    command: ["node", "dist/workers/main.js"]   # Asumiendo que existe un entrypoint para workers
    depends_on:
  postgres:
        condition: service_healthy
  redis:
        condition: service_healthy
        condition: service_healthy
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: agenteia-frontend
    ports:
      - "5173:80"   # Vite dev en desarrollo, nginx en producción
    depends_on:
      api:
    volumes:
      - ./frontend/src:/app/src
    volumes:
```

## 3. Variables de entorno (`.env.example`)

```env
# ─── Aplicación ──────────────────────────────────────────────
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:5173

# ─── Base de datos PostgreSQL ─────────────────────────────────
DB_HOST=postgres
DB_PORT=5432
DB_USER=agenteia
DB_PASS=agenteia_secret
DB_NAME=agenteia

# ─── Redis (caché + colas BullMQ) ─────────────────────────────
REDIS_URL=redis://redis:6379

# ─── JWT ──────────────────────────────────────────────────────
JWT_PRIVATE_KEY=""
JWT_PUBLIC_KEY=""
JWT_EXPIRES_IN=900
REFRESH_EXPIRES_IN=604800

# ─── Almacenamiento S3-compatible (desarrollo: MinIO) ─────────
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=agenteia-assets
S3_REGION=us-east-1

# ─── APIs externas de IA ──────────────────────────────────────
TOKENLAB_API_KEY=
OPENROUTER_API_KEY=
REPLICATE_API_KEY=
ELEVENLABS_API_KEY=

# ─── Feature Flags ────────────────────────────────────────────
FEATURE_AI_GENERATION=true
FEATURE_COMPETITOR_MONITORING=true
FEATURE_CUSTOM_DOMAINS=true

# ─── Opcionales ───────────────────────────────────────────────
SENTRY_DSN=
```

## 4. Volúmenes y persistencia

| Volumen     | Servicio | Ruta de montaje            | Propósito                               |
| :---------- | :------- | :------------------------- | :-------------------------------------- |
| `pgdata`    | postgres | `/var/lib/postgresql/data` | Datos persistentes de la base de datos  |
| `redisdata` | redis    | `/data`                    | Persistencia RDB/AOF de Redis           |
| `miniodata` | minio    | `/data`                    | Almacenamiento de objetos en desarrollo |
En producción, estos volúmenes se mapean a directorios locales o volúmenes administrados por Dokploy. Los assets subidos por los tenants se almacenan en el bucket S3 configurado (DigitalOcean Spaces en producción, MinIO en local). No hay volúmenes adicionales para la API o Frontend, ya que el código se monta como bind mount solo en desarrollo.

## 5. Cumplimiento con el MDD

- **Servicios**: Se han definido los cinco servicios requeridos por §7: API (NestJS), Frontend (React), PostgreSQL 16, Redis 7, y un Worker para procesamiento asíncrono (Outbox, generación IA, etc.). Se incluye MinIO como reemplazo local de S3, alineado con la nota de §7.4 que menciona MinIO para simulación.
- **Variables de entorno**: Se cubren todas las citadas en §7.5 (DB_HOST, DB_PORT, etc.; REDIS_URL; JWT_PRIVATE_KEY, etc.; S3_*; TOKENLAB_API_KEY, etc.; CORS_ORIGINS, LOG_LEVEL, SENTRY_DSN). Además se añaden feature flags y credenciales de MinIO para desarrollo.
- **Volúmenes**: Se definen volúmenes persistentes para PostgreSQL, Redis y MinIO, garantizando que los datos no se pierdan al reiniciar contenedores (requisito explícito del system prompt). El bucket S3 no requiere volumen porque es externo.
- **Puertos**: Solo se exponen los puertos del API (3000) y Frontend (5173). Los servicios internos (PostgreSQL, Redis, MinIO, Worker) no tienen `ports:` definidos, comunicándose por nombre de contenedor (DNS interno), conforme a la especificación.
- **Dependencias**: `depends on` con healthcheck asegura el orden de inicio correcto (PostgreSQL y Redis antes que API y Worker; API antes que Frontend).

## Registro de cambios del documento

| Versión | Fecha     | Descripción del cambio                                                                                           |
| :------ | :-------- | :--------------------------------------------------------------------------------------------------------------- |
| 1.0     | Mayo 2025 | Creación inicial del documento de Infraestructura y Despliegue para AgenteIA, basado en MDD §7 y stack definido. |