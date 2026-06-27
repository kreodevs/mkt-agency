#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run \
    -d ./apps/backend/dist/database/data-source.js
  echo "[entrypoint] Migrations complete."
fi

exec "$@"
