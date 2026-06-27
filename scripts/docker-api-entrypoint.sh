#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  yarn workspace @mkt-agency/backend migration:run:prod
  echo "[entrypoint] Migrations complete."
fi

exec "$@"
