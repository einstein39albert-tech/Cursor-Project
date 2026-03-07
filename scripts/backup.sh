#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/uorms}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/uorms}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${APP_DIR}/data/uorms.sqlite" ]; then
  echo "Database file not found at ${APP_DIR}/data/uorms.sqlite"
  exit 1
fi

cp "${APP_DIR}/data/uorms.sqlite" "${BACKUP_DIR}/uorms-${TIMESTAMP}.sqlite"

tar -czf "${BACKUP_DIR}/uorms-uploads-${TIMESTAMP}.tar.gz" \
  -C "${APP_DIR}/src/public" uploads

echo "Backup created in ${BACKUP_DIR}"
