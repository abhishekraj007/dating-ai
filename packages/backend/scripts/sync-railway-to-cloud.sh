#!/usr/bin/env bash
# Export Railway self-hosted prod DB and import into Convex Cloud prod.
# Requires:
#   .env.production.local       → CONVEX_SELF_HOSTED_URL + CONVEX_SELF_HOSTED_ADMIN_KEY
#   .env.cloud.production.local → CONVEX_DEPLOYMENT / CONVEX_URL / CONVEX_SITE_URL (Cloud)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RAILWAY_ENV=".env.production.local"
CLOUD_ENV=".env.cloud.production.local"
BACKUP_DIR="$ROOT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SNAPSHOT="$BACKUP_DIR/railway-prod-snapshot-$TIMESTAMP.zip"
LATEST_LINK="$BACKUP_DIR/railway-prod-snapshot.zip"

if [[ ! -f "$RAILWAY_ENV" ]]; then
  echo "Missing $RAILWAY_ENV (Railway self-hosted credentials)."
  exit 1
fi

if [[ ! -f "$CLOUD_ENV" ]]; then
  echo "Missing $CLOUD_ENV (Convex Cloud prod target)."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "==> Exporting Railway prod → $SNAPSHOT"
npx convex export \
  --env-file "$RAILWAY_ENV" \
  --include-file-storage \
  --path "$SNAPSHOT"

ln -sfn "$(basename "$SNAPSHOT")" "$LATEST_LINK"

echo "==> Importing snapshot into Convex Cloud prod (replace)"
npx convex import \
  --env-file "$CLOUD_ENV" \
  --replace \
  -y \
  "$SNAPSHOT"

echo "==> Sync complete."
echo "    Snapshot: $SNAPSHOT"
echo "    Cloud:    $(grep -E '^CONVEX_URL=' "$CLOUD_ENV" | cut -d= -f2- | tr -d '"')"
