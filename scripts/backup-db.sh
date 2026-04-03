#!/bin/bash

# Database backup script
# Usage: ./scripts/backup-db.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/webapp_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."

# Check if Docker container is running
if docker compose ps db | grep -q "postgres"; then
    # Backup from Docker
    docker compose exec -T db pg_dump -U postgres webapp > "$BACKUP_FILE"
    echo "✅ Backup saved to: $BACKUP_FILE"
else
    # Backup from local PostgreSQL
    if command -v pg_dump &> /dev/null; then
        pg_dump -U postgres -d webapp > "$BACKUP_FILE"
        echo "✅ Backup saved to: $BACKUP_FILE"
    else
        echo "❌ Error: PostgreSQL tools not found. Make sure Docker or PostgreSQL is installed."
        exit 1
    fi
fi

# Show file size
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 Backup size: $SIZE"
else
    echo "❌ Backup failed"
    exit 1
fi
