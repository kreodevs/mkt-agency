#!/usr/bin/env sh
# Borra datos operativos (onboarding, productos, contenido, agentes, CRM…)
# Conserva usuarios, tenants, sesiones y config de plataforma (LLM, paquetes).
#
# Uso local:
#   ./scripts/reset-tenant-operational-data.sh
#
# En Dokploy: se aplica automáticamente al desplegar vía migración 0024
# (entrypoint RUN_MIGRATIONS=true). Para omitir: SKIP_OPERATIONAL_DATA_RESET=true

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/backend"

if [ "${SKIP_OPERATIONAL_DATA_RESET:-}" = "true" ]; then
  echo "SKIP_OPERATIONAL_DATA_RESET=true — no se ejecuta reset."
  exit 0
fi

echo "Ejecutando migración ResetTenantOperationalData (0024)..."
yarn build
yarn migration:run:prod

echo "Listo. Usuarios y tenants intactos; datos operativos eliminados."
