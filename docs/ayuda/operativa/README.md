# Guía operativa y troubleshooting

## Qué es

Referencia para **operadores de plataforma** y desarrolladores: despliegue, variables de entorno, migraciones, reset de datos y resolución de errores frecuentes.

## Para qué sirve

Mantener instancias en Dokploy/Docker, recuperarse de estados inconsistentes y diagnosticar fallos de IA, storage o publicación.

---

## Variables de entorno esenciales

Copia base: `.env.example`. En Dokploy: servicio Compose → **Environment**.

### Base de datos

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL 16 |
| `DB_PASS` | Alias legacy de `DB_PASSWORD` |

> PostgreSQL fija contraseña solo al crear volumen `pgdata`. Cambiar `DB_PASSWORD` después requiere reset del volumen.

### Aplicación

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | 3000 (API interna) |
| `LOG_LEVEL` | `debug` local, `info` prod |
| `CORS_ORIGIN` | Origen del frontend |
| `API_PUBLIC_URL` | URL pública API, ej. `https://app.example.com/api/v1` — snippets, callbacks n8n, lip-sync CM |
| `JWT_SECRET` / `JWT_*_PEM` | Auth (RSA PEM en Dokploy) |
| `JWT_EXPIRES_IN` | Default `7d` |
| `APP_VERSION` | Override opcional PWA |

### Redis y colas

| Variable | Descripción |
|----------|-------------|
| `REDIS_URL` | BullMQ — obligatorio para jobs (prepare-week, cron semanal, sugerencias IA) |

### Almacenamiento

| Variable | Descripción |
|----------|-------------|
| `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT` | MinIO o DO Spaces |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` | Credenciales |
| `MINIO_DATA_DIR` | Ruta host datos MinIO |
| `STORAGE_LOCAL_PUBLIC_BASE` | Fallback uploads locales |

### Dominios

| Variable | Descripción |
|----------|-------------|
| `DOMAIN_CNAME_TARGET` | Target CNAME para tenants |
| `DOMAIN_DNS_STUB` | `true` — omitir DNS real en dev |

### Migraciones y reset (servicio `api`)

| Variable | Efecto |
|----------|--------|
| `RUN_MIGRATIONS` | Default `true` — corre migraciones al arrancar |
| `SKIP_OPERATIONAL_DATA_RESET` | `true` — omite migración one-shot 0024 |
| `SKIP_GENERATED_CONTENT_RESET` | `true` — omite limpieza 0032 |
| `RUN_GENERATED_CONTENT_RESET` | `true` — ejecuta CLI clear-generated-contents en deploy |

---

## Despliegue Dokploy

Archivo Compose: **`docker-compose.dokploy.yml`** (no usar `docker-compose.yml` en prod).

1. Compose Type → repo → path `docker-compose.dokploy.yml`
2. Variables desde `.env.example`
3. Dominio en servicio **frontend** puerto **80**
4. nginx proxy `/api/` → `mkt-agency-api:3000` (alias interno, no `api` genérico)

Detalle: [`infra/dokploy/README.md`](../../infra/dokploy/README.md).

### Migraciones automáticas

Entrypoint `scripts/docker-api-entrypoint.sh`:

```bash
yarn workspace @mkt-agency/backend migration:run:prod
```

Worker: `RUN_MIGRATIONS=false`, espera API healthy.

Manual local:

```bash
cd apps/backend
yarn migration:run        # dev
yarn migration:run:prod   # dist compilado
```

---

## Reset de contenidos y datos

### Vaciar bandeja (contenidos generados)

**Migración one-shot:** `1730000000032-ClearGeneratedContentsAndCompetitorAnalyses`

Conserva: tenants, productos, tags SEO.  
Borra: contents, batches CM, generaciones imagen/video, análisis competidor, competidores descubiertos.

**Script local:**

```bash
./scripts/clear-generated-contents.sh
# Forzar:
SKIP_GENERATED_CONTENT_RESET=false ./scripts/clear-generated-contents.sh
# Omitir en deploy:
SKIP_GENERATED_CONTENT_RESET=true
```

**Deploy Dokploy (un redeploy):**

```
RUN_GENERATED_CONTENT_RESET=true
SKIP_GENERATED_CONTENT_RESET=false
SKIP_OPERATIONAL_DATA_RESET=true
```

Buscar en logs:

```
[entrypoint] RUN_GENERATED_CONTENT_RESET=true — clearing generated contents...
[clear-generated-contents] Cleared N table(s)...
```

**UI:** Purge en bandeja (`POST /publication-inbox/purge`) — por producto y alcance, no borra productos.

**Verificar:** `SELECT count(*) FROM contents;` → `0`.

### Reset operativo completo (pruebas desde cero)

**Migración:** `1730000000024-ResetTenantOperationalData`

Borra onboarding, productos, campañas, CRM, etc. **Conserva** users, tenants, LLM, paquetes.

```bash
./scripts/reset-tenant-operational-data.sh
SKIP_OPERATIONAL_DATA_RESET=true   # omitir
```

---

## Errores comunes

### IA / agentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| «No se pudo generar» / 502 LLM | Sin proveedor en `/admin/llm-providers` | Configurar OpenRouter u otro |
| 429 rate limit | Límite proveedor | Configurar fallback en llm-settings |
| Competidores vacíos | Tavily no configurado | `/admin/integrations` |
| Brand Brief en failed | Registro legacy | Refrescar lista; backend reconcilia si hay markdown |
| Video no genera | Tarea `video_generation` sin modelo | llm-settings |

### Bandeja / copiloto

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Bandeja llena tras «reset» | Purge no corrido o migración omitida | Script clear-generated-contents |
| Preparar semana no termina | Redis caído o job failed | Logs worker; `GET prepare-week/jobs/:id` |
| Notificaciones no llegan | Tabla `agency_notifications` | Revisar cron worker |
| Auto n8n no dispara | Webhook off o fecha ≠ hoy | Producto → integración n8n |

### Publicación n8n

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| 401 callback | Secret distinto Mkt Agency ↔ n8n | Unificar `X-Webhook-Secret` |
| Asset URL expirada | >1 h en cola n8n | Re-publicar arte |
| Instagram falla | Token Meta / IG Business ID | Variables n8n + credentials producto |

### Auth / impersonación

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Superadmin no entra a tenant | Sin impersonar | Usar Impersonar en `/tenants` |
| 401 al impersonar | Sin proxy user | Asignar platform admin al tenant |
| Loop login | JWT expirado | Logout y login |

### Storage / CM virtual

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Upload falla | S3/MinIO down o credenciales | Revisar `S3_*`, contenedor MinIO |
| Lip-sync falla local | URL interna Docker | `API_PUBLIC_URL` público + túnel |
| Imágenes rotas en bandeja | `S3_PUBLIC_ENDPOINT` incorrecto | Alinear endpoint público |

### Base de datos

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| API no arranca tras cambio password | Volumen pg con password vieja | Reset volumen pgdata |
| Migración falla | Orden pendiente | Logs api entrypoint; run manual |

---

## Comprobaciones rápidas

```bash
# Health API (ajustar URL)
curl -s https://tu-dominio/api/v1/setup/status

# Redis
redis-cli -u "$REDIS_URL" ping

# Contenidos en BD (contenedor api)
psql -c "SELECT status, count(*) FROM contents GROUP BY status;"
```

---

## Logs útiles

| Servicio | Dónde |
|----------|-------|
| API | Dokploy → servicio api → Logs |
| Worker | Dokploy → worker (cron, prepare-week) |
| Entrypoint migraciones | Prefijo `[entrypoint]` |
| Clear contents | Prefijo `[clear-generated-contents]` |

---

## Relacionado con

- [Hub de ayuda](../README.md)
- [Copiloto y bandeja](../copiloto-bandeja/README.md) — purge UI
- [Publicación n8n](../publicacion-n8n/README.md)
- [Ajustes](../ajustes-integraciones/README.md)
- [`apps/backend/src/database/README.md`](../../apps/backend/src/database/README.md)
