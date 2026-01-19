#!/bin/bash
set -e

# This script restores the database from the dump file
echo "🔄 Starting database restoration from dump file..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database already has data
TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo "ℹ️  Database already contains $TABLE_COUNT tables. Skipping restore."
  exit 0
fi

echo "📦 Restoring database from dump file..."

# Restore the dump file
if [ -f /backup/backup.dump ]; then
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v /backup/backup.dump || {
    echo "⚠️  pg_restore encountered some errors (this is normal for some dump formats)"
    echo "🔍 Checking if data was restored successfully..."
    
    NEW_TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    
    if [ "$NEW_TABLE_COUNT" -gt 0 ]; then
      echo "✅ Database restored successfully with $NEW_TABLE_COUNT tables!"
    else
      echo "❌ Database restoration failed!"
      exit 1
    fi
  }
  
  echo "✅ Database dump restored successfully!"
else
  echo "❌ Dump file not found at /backup/backup.dump"
  exit 1
fi

echo "🎉 Database restoration complete!"

