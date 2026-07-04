#!/usr/bin/env sh
# Borra contenidos generados, análisis de competidores y competidores descubiertos.
# Conserva tenants, productos y tags SEO (products.keywords).
#
# Uso local:
#   ./scripts/clear-generated-contents.sh
#
# En Dokploy: migración 0032 al desplegar (RUN_MIGRATIONS=true).
# Para omitir: SKIP_GENERATED_CONTENT_RESET=true

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/backend"

if [ "${SKIP_GENERATED_CONTENT_RESET:-}" = "true" ]; then
  echo "SKIP_GENERATED_CONTENT_RESET=true — no se ejecuta limpieza."
  exit 0
fi

echo "Ejecutando migración ClearGeneratedContentsAndCompetitorAnalyses (0032)..."
yarn build
yarn migration:run:prod

echo "Listo. Tenants, productos y tags SEO intactos; contenidos, análisis y competidores eliminados."
