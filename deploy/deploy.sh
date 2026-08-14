#!/usr/bin/env bash
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
TARGET_DIR="/var/www/reservation.dmenergy.ae"

echo "[1/4] Validate deploy directories"
if [ ! -d "$ROOT/dist" ]; then
  echo "Build output not found: $ROOT/dist"
  exit 1
fi

mkdir -p "$TARGET_DIR"

echo "[2/4] Sync static build"
rsync -a --delete "$ROOT/dist/" "$TARGET_DIR/"

echo "[3/4] Normalize permissions"
find "$TARGET_DIR" -type d -exec chmod 755 {} +
find "$TARGET_DIR" -type f -exec chmod 644 {} +

echo "[4/4] Deploy completed"
