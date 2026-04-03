#!/bin/bash

# Database reset script
# Usage: ./scripts/reset-db.sh
# WARNING: This will drop all data!

echo "⚠️  WARNING: This will DELETE all database data!"
read -p "Are you sure? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo "🔄 Resetting database..."

# Check if Docker container is running
if docker compose ps db | grep -q "postgres"; then
    # Reset via Docker
    echo "📦 Using Docker container..."
    docker compose exec -T db psql -U postgres -d webapp << EOF
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
EOF
    
    # Reinitialize schema
    docker compose exec -T db psql -U postgres -d webapp < database/init.sql
else
    # Reset local PostgreSQL
    if command -v psql &> /dev/null; then
        echo "💾 Using local PostgreSQL..."
        psql -U postgres -d webapp << EOF
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
EOF
        
        # Reinitialize schema
        psql -U postgres -d webapp < database/init.sql
    else
        echo "❌ Error: PostgreSQL tools not found. Make sure Docker or PostgreSQL is installed."
        exit 1
    fi
fi

echo "✅ Database reset complete"
