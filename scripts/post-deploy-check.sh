#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
APP_DIR="${APP_DIR:-$(pwd)}"

echo "== UORMS post-deploy check =="
echo "App directory: ${APP_DIR}"
echo "App URL: ${APP_URL}"
echo

echo "1) Checking health endpoint..."
curl -fsS "${APP_URL}/health"
echo
echo

echo "2) Checking .env presence..."
if [ -f "${APP_DIR}/.env" ]; then
  echo ".env found"
else
  echo ".env missing"
  exit 1
fi

echo
echo "3) Checking database file..."
if [ -f "${APP_DIR}/data/uorms.sqlite" ]; then
  ls -lh "${APP_DIR}/data/uorms.sqlite"
else
  echo "Database file not found at ${APP_DIR}/data/uorms.sqlite"
  exit 1
fi

echo
echo "4) Checking uploads directory..."
if [ -d "${APP_DIR}/src/public/uploads" ]; then
  ls -ld "${APP_DIR}/src/public/uploads"
else
  echo "Uploads directory missing"
  exit 1
fi

echo
echo "5) Checking password reset helper..."
if [ -f "${APP_DIR}/scripts/reset-password.js" ]; then
  echo "Password reset helper found"
else
  echo "Password reset helper missing"
  exit 1
fi

echo
echo "6) Suggested next command:"
echo "npm run reset-password -- admin"
echo
echo "Post-deploy check completed successfully."
