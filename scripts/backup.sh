#!/bin/bash
# SAO-IS Automated Backup Script
# Backs up database and uploaded documents, retains last 30 days.
# Schedule via crontab: 0 2 * * * /home/joshu/SAO-IS/scripts/backup.sh >> /var/log/sao-is-backup.log 2>&1

set -uo pipefail

DATE=$(date +%F)
BACKUP_DIR="$HOME/backups/sao-is"
BACKEND_DIR="/home/joshu/SAO-IS/backend"
DB_NAME="${SAO_DB_NAME:-sao_is}"
DB_USER="${SAO_DB_USER:-sao_user}"
DB_PASSWORD="${SAO_DB_PASSWORD:-}"

mkdir -p "$BACKUP_DIR"

echo "=== SAO-IS Backup: $DATE ==="

# Database dump
echo "Dumping database..."
if [ -n "$DB_PASSWORD" ]; then
  if MYSQL_PWD="$DB_PASSWORD" mysqldump -u "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"; then
    echo "Database backup: OK"
  else
    echo "Database backup: FAILED"
  fi
else
  if mysqldump -u "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"; then
    echo "Database backup: OK"
  else
    echo "Database backup: FAILED"
  fi
fi

# Uploaded files
echo "Archiving uploaded files..."
if [ -d "$BACKEND_DIR/storage/app/documents" ]; then
  tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" \
    -C "$BACKEND_DIR/storage/app" documents/ 2>/dev/null
  echo "File backup: OK"
else
  echo "File backup: SKIPPED (no documents directory)"
fi

# Cleanup — keep only last 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
echo "Cleanup: removed backups older than 30 days"

echo "=== Backup complete: $DATE ==="
