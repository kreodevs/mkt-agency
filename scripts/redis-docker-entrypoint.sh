#!/bin/sh
set -e

DATA_DIR="${REDIS_DATA_DIR:-/data}"

log() {
  echo "[redis-entrypoint] $*" >&2
}

quarantine_legacy_persistence() {
  if [ ! -f "${DATA_DIR}/appendonly.aof.manifest" ] \
    && [ ! -f "${DATA_DIR}/appendonly.aof" ] \
    && [ ! -f "${DATA_DIR}/dump.rdb" ]; then
    return 0
  fi

  ts=$(date +%s)
  backup="${DATA_DIR}/.legacy-persistence-${ts}"
  mkdir -p "$backup"
  log "Quarantining legacy Redis persistence to ${backup}"

  find "$DATA_DIR" -maxdepth 1 \( \
    -name 'appendonly.aof' -o \
    -name 'appendonly.aof.*' -o \
    -name 'dump.rdb' \
  \) -exec mv {} "$backup/" \;
}

log "Starting $(redis-server --version 2>&1 | head -1)"
quarantine_legacy_persistence
log "Launching redis-server"
exec "$@"
