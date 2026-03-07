#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/uorms}"
SERVICE_NAME="${SERVICE_NAME:-uorms}"

echo "Deploying UORMS into ${APP_DIR}"

mkdir -p "${APP_DIR}"
mkdir -p /var/log/uorms

if command -v rsync >/dev/null 2>&1; then
  rsync -av --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "dist" \
    ./ "${APP_DIR}/"
else
  cp -R . "${APP_DIR}/"
fi

cd "${APP_DIR}"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit it before production use."
fi

npm install --omit=dev

if command -v systemctl >/dev/null 2>&1; then
  cp deploy/systemd/uorms.service "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
  systemctl restart "${SERVICE_NAME}"
  systemctl status "${SERVICE_NAME}" --no-pager || true
else
  echo "systemctl not found. Use PM2 with ecosystem.config.js instead."
fi

echo "Deployment complete."
