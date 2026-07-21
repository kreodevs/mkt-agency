#!/bin/sh
set -e

DATA_DIR="${REDIS_DATA_DIR:-/data}"
RESET_ON_FAIL="${REDIS_AOF_RESET_ON_CORRUPT:-true}"

repair_aof_file() {
  target="$1"
  echo "[redis-entrypoint] Verifying ${target}..."
  if redis-check-aof "$target" >/dev/null 2>&1; then
    echo "[redis-entrypoint] ${target} OK"
    return 0
  fi

  echo "[redis-entrypoint] Corrupt AOF (${target}) — running redis-check-aof --fix"
  if yes | redis-check-aof --fix "$target" >/dev/null 2>&1; then
    echo "[redis-entrypoint] ${target} repaired"
    return 0
  fi

  return 1
}

reset_aof_data() {
  ts=$(date +%s)
  backup="${DATA_DIR}/.corrupt-backup-${ts}"
  mkdir -p "$backup"
  echo "[redis-entrypoint] Resetting Redis persistence — backup in ${backup}"

  find "$DATA_DIR" -maxdepth 1 \( \
    -name 'appendonly.aof' -o \
    -name 'appendonly.aof.*' -o \
    -name 'dump.rdb' \
  \) -exec mv {} "$backup/" \;
}

if [ -f "${DATA_DIR}/appendonly.aof.manifest" ]; then
  if ! repair_aof_file "${DATA_DIR}/appendonly.aof.manifest"; then
    if [ "$RESET_ON_FAIL" = "true" ]; then
      reset_aof_data
    else
      echo "[redis-entrypoint] AOF corrupt and REDIS_AOF_RESET_ON_CORRUPT=false — aborting"
      exit 1
    fi
  fi
elif [ -f "${DATA_DIR}/appendonly.aof" ]; then
  if ! repair_aof_file "${DATA_DIR}/appendonly.aof"; then
    if [ "$RESET_ON_FAIL" = "true" ]; then
      reset_aof_data
    else
      echo "[redis-entrypoint] AOF corrupt and REDIS_AOF_RESET_ON_CORRUPT=false — aborting"
      exit 1
    fi
  fi
fi

exec redis-server "$@"
