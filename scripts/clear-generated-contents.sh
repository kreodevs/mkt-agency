#!/usr/bin/env sh
# Borra contenidos generados, análisis de competidores y competidores descubiertos.
# Conserva tenants, productos y tags SEO (products.keywords).
#
# Uso local / Dokploy (terminal del contenedor api):
#   SKIP_GENERATED_CONTENT_RESET=false ./scripts/clear-generated-contents.sh
#
# Omitir limpieza:
#   SKIP_GENERATED_CONTENT_RESET=true ./scripts/clear-generated-contents.sh
#
# Ejecuta migraciones pendientes y luego limpieza idempotente (aunque 0032 ya esté aplicada).

set -e

export SKIP_GENERATED_CONTENT_RESET="${SKIP_GENERATED_CONTENT_RESET:-false}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/backend"

if [ "$SKIP_GENERATED_CONTENT_RESET" = "true" ]; then
  echo "SKIP_GENERATED_CONTENT_RESET=true — no se ejecuta limpieza."
  exit 0
fi

echo "SKIP_GENERATED_CONTENT_RESET=false — limpiando contenidos generados..."
yarn build
yarn migration:run:prod
node dist/database/clear-generated-contents.cli.js

echo "Listo. Tenants, productos y tags SEO intactos; contenidos, análisis y competidores eliminados."
