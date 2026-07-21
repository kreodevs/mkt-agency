# Redis (Compose)

Imagen custom `Dockerfile.redis` para Dokploy/local:

- `redis.conf` — sin AOF, sin RDB (`appendonly no`, `save ""`).
- Entrypoint embebido en la imagen (no bind mount): cuarentena de `appendonly.aof*` / `dump.rdb` legacy al arrancar.

Solo colas BullMQ y rate-limit; no persiste datos de negocio.
