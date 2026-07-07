#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run \
    -d ./apps/backend/dist/database/data-source.js
  echo "[entrypoint] Migrations complete."
fi

if [ "${RUN_GENERATED_CONTENT_RESET:-false}" = "true" ]; then
  if [ "${SKIP_GENERATED_CONTENT_RESET:-false}" = "true" ]; then
    echo "[entrypoint] RUN_GENERATED_CONTENT_RESET=true but SKIP_GENERATED_CONTENT_RESET=true — skipping content clear."
  elif [ ! -f ./apps/backend/dist/database/clear-generated-contents.cli.js ]; then
    echo "[entrypoint] RUN_GENERATED_CONTENT_RESET=true but clear-generated-contents.cli.js not found — rebuild api image."
    exit 1
  else
    echo "[entrypoint] RUN_GENERATED_CONTENT_RESET=true — clearing generated contents (SKIP_GENERATED_CONTENT_RESET=false)..."
    node ./apps/backend/dist/database/clear-generated-contents.cli.js
    echo "[entrypoint] Generated contents clear finished. Set RUN_GENERATED_CONTENT_RESET=false before next deploy."
  fi
fi

exec "$@"
