# Despliegue en Dokploy

Stack de producción: **`docker-compose.dokploy.yml`** (Compose Type en Dokploy).

Desarrollo local: **`docker-compose.yml`**.

## 1. Crear proyecto Compose en Dokploy

1. **Projects** → nuevo proyecto → entorno (ej. `production`).
2. **Create Service** → **Compose**.
3. Conectar repositorio Git (`kreodevs/mkt-agency`).
4. **Compose file path:** `docker-compose.dokploy.yml`  
   ⚠️ **No uses** `docker-compose.yml` en Dokploy: ese archivo publica `3000:3000` y usa `container_name`, lo que provoca conflictos de puerto y rompe métricas/logs en Dokploy.

5. **Build context:** raíz del repo (`.`).

## 2. Variables de entorno

Copiar desde `.env.example` y definir en Dokploy → **Environment**:

| Variable | Notas |
|----------|--------|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Misma contraseña en postgres + api/worker; obligatoria antes del 1er deploy |
| `JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM` | RSA PEM (una línea con `\n`) |
| `S3_*` | MinIO interno o DO Spaces en prod |
| `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` | OpenRouter / proveedor IA |
| `CORS_ORIGIN` | Origen del frontend (dominio público) |
| `API_PUBLIC_URL` | URL pública API, ej. `https://app.example.com/api/v1` |
| `LOG_LEVEL` | `info` en prod |
| `APP_VERSION` | (opcional) commit SHA para `version.json` / PWA; si vacío, timestamp de deploy |

> PostgreSQL fija la contraseña solo al crear el volumen `pgdata`. Si cambias `DB_PASSWORD` después, resetea el volumen (§10).

## 3. Dominio (recomendado: UI Domains)

1. Servicio **frontend** → pestaña **Domains**.
2. Añadir dominio (ej. `app.tudominio.com`).
3. Puerto interno: **80**.
4. HTTPS: Let's Encrypt (Dokploy inyecta labels Traefik).

El nginx del frontend hace proxy de `/api/` al servicio `mkt-agency-api:3000` en la red `internal`.

> **Importante:** no uses el hostname genérico `api` en nginx. Otros stacks en el mismo servidor (p. ej. Kreo Eventos) registran el alias `api` en `dokploy-network` y el frontend resolvería el backend equivocado. El compose define el alias `mkt-agency-api` solo en la red interna del stack.

> Si configuras dominio manual con labels, mantén `traefik.docker.network=dokploy-network`.

## 4. Migraciones

Al arrancar el contenedor **`api`**, el entrypoint (`scripts/docker-api-entrypoint.sh`) ejecuta automáticamente:

```bash
yarn workspace @mkt-agency/backend migration:run:prod
```

El servicio **`worker`** define `RUN_MIGRATIONS=false` y espera a que `api` esté healthy (migraciones ya aplicadas).

Para desactivar migraciones automáticas (p. ej. debug): `RUN_MIGRATIONS=false` en el servicio `api`.

Manual (solo si hace falta):

```bash
# En el contenedor api (Dokploy → Terminal)
yarn workspace @mkt-agency/backend migration:run:prod
```

## 5. Volúmenes

Persistencia gestionada por Dokploy:

- `pgdata` — PostgreSQL
- `redisdata` — Redis AOF
- `miniodata` — MinIO (solo si no usas S3 externo)

Programar backups de `pgdata` desde Dokploy → Volume Backups.

## 6. Servicios expuestos

| Servicio | Red pública | Acceso |
|----------|-------------|--------|
| frontend | `dokploy-network` | Dominio Traefik (solo UI; `/api` va por nginx interno) |
| api | solo `internal` | vía nginx → `mkt-agency-api:3000` (no añadir dominio Traefik) |
| postgres, redis, minio, worker | solo `internal` | no exponer |

## 7. Worker

`worker` comparte imagen con `api` (procesadores BullMQ en el monolito). En despliegues pequeños puedes escalar solo `api`; mantener `worker` si quieres separar carga HTTP de jobs (ambos consumen la misma cola).

## 8. Healthchecks

- API: `GET /api/v1/setup/status` cada 30s (MDD §7).
- Dokploy reinicia tras fallos consecutivos según política del servidor.

## 9. CI → Dokploy

GitHub Actions (`.github/workflows/ci.yml`) valida `yarn build`. Configura webhook de deploy en Dokploy al push en `main`.

## 10. Troubleshooting

### `Bind for 0.0.0.0:3000 failed: port is already allocated`

Causa habitual: el servicio Compose en Dokploy apunta a **`docker-compose.yml`** en lugar de **`docker-compose.dokploy.yml`**.

| Archivo | API en host |
|---------|-------------|
| `docker-compose.dokploy.yml` | No expone puertos (correcto en prod) |
| `docker-compose.yml` | Publica `${API_PUBLISH_PORT:-3001}:3000` (solo local) |

**Solución:** en Dokploy → Compose → **Compose Path** → `docker-compose.dokploy.yml` → redeploy.

Si otro stack del mismo servidor ya usa el 3000, no afecta a `docker-compose.dokploy.yml` siempre que no publiques el puerto en el servicio `api`.

### `column UserEntity.is_superadmin does not exist`

El volumen `pgdata` conserva el esquema **legacy** (`users.password`, `isSuperAdmin`, …). La migración baseline (`1730000000000`) usa `CREATE TABLE IF NOT EXISTS` y no altera tablas existentes.

**Solución A — conservar datos:** despliega código con migración `1729999999999-UpgradeLegacyUsersSchema` (entrypoint `api` la ejecuta al arrancar, antes del baseline).

**Solución B — reset:** eliminar volumen `pgdata` y redeploy (esquema limpio monorepo).

El stack **legacy** (pre-monorepo) hasheaba con **SHA256 hex** (64 chars), no bcrypt ni Argon2. Tras migrar `password` → `password_hash`, el login fallaba con 401 aunque la contraseña fuera correcta.

**Solución (código ≥ fix sha256):** `Password.verify` acepta SHA256 legacy y rehashea a Argon2id al login exitoso. Si quedaste bloqueado por intentos fallidos, la migración `1730000000009` resetea lockout de superadmins.

### Chunks JS devuelven `text/html` / MIME type error en el navegador

Tras un redeploy, el navegador puede conservar un `index.html` antiguo que referencia hashes viejos (`index-*.js`, `DashboardHomePage-*.js`). Nginx respondía `index.html` para assets inexistentes → error de MIME.

**Solución inmediata:** recarga forzada (`Ctrl+Shift+R` / `Cmd+Shift+R`) o ventana privada.

**Solución en servidor (nginx):** `/assets/` usa `try_files $uri =404` (sin SPA fallback) e `index.html` lleva `Cache-Control: no-cache`. Redeploy del servicio `frontend`.

### `security_events_tenant_id_fkey` en login

Usuarios legacy pueden tener `users.tenant_id` apuntando a tenants que ya no existen (tablas `*_legacy`). Al registrar `login_failed`, la FK fallaba y el login devolvía 500.

**Solución (código ≥ fix orphan tenant):** `SecurityEventRecorderService` omite `tenant_id` inválido y guarda el valor original en `metadata.orphanTenantId`. Redeploy `api`.

### `password authentication failed for user "mktos"`

La API llega a Postgres pero la contraseña no coincide con la del volumen persistente.

**Causas habituales**

1. `DB_PASSWORD` no definida en Dokploy en el **primer** deploy → Postgres se inicializó con otra clave (o vacía) y la API usa `change_me`.
2. Cambiaste `DB_PASSWORD` en Dokploy **después** del primer deploy sin resetear `pgdata`.
3. Usabas `DB_PASS` en env pero el compose esperaba `DB_PASSWORD` (unifica en `DB_PASSWORD`).

**Solución A — alinear contraseña (sin borrar datos)**

En Dokploy Environment, define exactamente la misma contraseña con la que se creó el volumen. Si no la recuerdas, usa la B.

**Solución B — resetear Postgres (borra datos)**

1. Dokploy → Compose → detener stack.
2. Eliminar volumen `pgdata` (Volume Backups / volúmenes Docker del proyecto).
3. En Environment, fijar por ejemplo:
   ```
   DB_NAME=mktos
   DB_USER=mktos
   DB_PASSWORD=<contraseña_fuerte>
   ```
4. Redeploy → ejecutar migraciones → `setup/init`.

**Verificar desde el contenedor api**

```bash
printenv DB_USER DB_PASSWORD DB_HOST
# Debe coincidir con POSTGRES_* del servicio postgres en el mismo deploy
```

### Build frontend: `COPY .git .git` → `"/.git": not found`

Dokploy clona el repo **sin** carpeta `.git` (shallow export). El Dockerfile ya no depende de git.

**Versión PWA (`version.json`):** cada build usa `deploy-YYYYMMDDHHMMSS` (UTC) si no defines `APP_VERSION` en Environment de Dokploy. Opcional: `APP_VERSION=<commit-sha>` para trazabilidad.

**Solución:** redeploy con código actual (`Dockerfile.frontend` sin `COPY .git`).
