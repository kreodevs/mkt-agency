#!/bin/sh
set -e

DATA_DIR="${REDIS_DATA_DIR:-/data}"
RESET_ON_FAIL="${REDIS_AOF_RESET_ON_CORRUPT:-true}"

log() {
  echo "[redis-entrypoint] $*" >&2
}

appendonly_enabled() {
  while [ $# -gt 0 ]; do
    if [ "$1" = "--appendonly" ]; then
      if [ "${2:-}" = "yes" ]; then
        return 0
      fi
      return 1
    fi
    shift
  done
  return 1
}

reset_aof_data() {
  ts=$(date +%s)
  backup="${DATA_DIR}/.corrupt-backup-${ts}"
  mkdir -p "$backup"
  log "Resetting Redis persistence — backup in ${backup}"

  find "$DATA_DIR" -maxdepth 1 \( \
    -name 'appendonly.aof' -o \
    -name 'appendonly.aof.*' -o \
    -name 'dump.rdb' \
  \) -exec mv {} "$backup/" \;
}

repair_aof_file() {
  target="$1"
  log "Verifying ${target}..."
  if redis-check-aof "$target" >/dev/null 2>&1; then
    log "${target} OK"
    return 0
  fi

  log "Corrupt AOF (${target}) — running redis-check-aof --fix"
  if yes | redis-check-aof --fix "$target" >/dev/null 2>&1 \
    && redis-check-aof "$target" >/dev/null 2>&1; then
    log "${target} repaired"
    return 0
  fi

  log "${target} could not be repaired"
  return 1
}

prepare_aof_persistence() {
  if [ -f "${DATA_DIR}/appendonly.aof.manifest" ]; then
    if ! repair_aof_file "${DATA_DIR}/appendonly.aof.manifest"; then
      if [ "$RESET_ON_FAIL" = "true" ]; then
        reset_aof_data
      else
        log "AOF corrupt and REDIS_AOF_RESET_ON_CORRUPT=false — aborting"
        exit 1
      fi
    fi
  elif [ -f "${DATA_DIR}/appendonly.aof" ]; then
    if ! repair_aof_file "${DATA_DIR}/appendonly.aof"; then
      if [ "$RESET_ON_FAIL" = "true" ]; then
        reset_aof_data
      else
        log "AOF corrupt and REDIS_AOF_RESET_ON_CORRUPT=false — aborting"
        exit 1
      fi
    fi
  fi
}

quarantine_legacy_aof() {
  if [ ! -f "${DATA_DIR}/appendonly.aof.manifest" ] \
    && [ ! -f "${DATA_DIR}/appendonly.aof" ]; then
    return 0
  fi

  ts=$(date +%s)
  backup="${DATA_DIR}/.aof-quarantine-${ts}"
  mkdir -p "$backup"
  log "Appendonly disabled — quarantining legacy AOF to ${backup}"

  find "$DATA_DIR" -maxdepth 1 \( \
    -name 'appendonly.aof' -o \
    -name 'appendonly.aof.*' \
  \) -exec mv {} "$backup/" \;
}

probe_redis_start() {
  log "Probing redis-server startup..."
  if redis-server "$@" --daemonize yes --dir "$DATA_DIR" >/dev/null 2>&1; then
    sleep 1
    if redis-cli -h 127.0.0.1 ping 2>/dev/null | grep -Eq '^(PONG|LOADING)'; then
      redis-cli -h 127.0.0.1 shutdown nosave >/dev/null 2>&1 || true
      sleep 1
      log "Startup probe OK"
      return 0
    fi
    redis-cli -h 127.0.0.1 shutdown nosave >/dev/null 2>&1 || true
  fi

  log "Startup probe failed"
  return 1
}

log "Starting (Redis $(redis-server --version | head -1))"

if appendonly_enabled "$@"; then
  prepare_aof_persistence
else
  quarantine_legacy_aof
fi

if ! probe_redis_start "$@"; then
  if [ "$RESET_ON_FAIL" = "true" ]; then
    reset_aof_data
    quarantine_legacy_aof
  else
    log "Redis failed probe and REDIS_AOF_RESET_ON_CORRUPT=false — aborting"
    exit 1
  fi
fi

log "Launching redis-server"
exec redis-server "$@"
