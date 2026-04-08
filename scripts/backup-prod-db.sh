#!/bin/bash
set -e

# Backup production database before deploys/migrations
# Usage: PROD_DATABASE_URL="postgresql://..." bash scripts/backup-prod-db.sh

if [ -z "$PROD_DATABASE_URL" ]; then
  echo "Error: PROD_DATABASE_URL environment variable is required"
  echo "Usage: PROD_DATABASE_URL=\"postgresql://...\" bash scripts/backup-prod-db.sh"
  exit 1
fi

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$TIMESTAMP.sql"

echo "Starting backup..."
pg_dump "$PROD_DATABASE_URL" > "$BACKUP_FILE"
echo "Backup saved: $BACKUP_FILE ($(wc -c < "$BACKUP_FILE" | tr -d ' ') bytes)"
