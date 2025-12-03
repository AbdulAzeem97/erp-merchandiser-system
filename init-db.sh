#!/bin/bash
set -e

echo "Starting database initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U erp_user -d erp_merchandiser; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if the SQL dump file exists
if [ -f /docker-entrypoint-initdb.d/complete-dump.sql ]; then
  echo "Found complete-dump.sql file. Restoring database..."
  
  # Restore the SQL dump file
  psql -U erp_user -d erp_merchandiser -f /docker-entrypoint-initdb.d/complete-dump.sql || {
    echo "SQL restore failed. Database might already be populated or there was an error."
    exit 1
  }
  
  echo "Database restoration completed!"
elif [ -f /docker-entrypoint-initdb.d/backup.dump ]; then
  echo "Found backup.dump file. Restoring database..."
  
  # Restore the database dump
  pg_restore -U erp_user -d erp_merchandiser -v /docker-entrypoint-initdb.d/backup.dump || {
    echo "pg_restore failed or database already exists. Trying alternative restore method..."
    
    # If pg_restore fails (e.g., for plain SQL dumps), try psql
    psql -U erp_user -d erp_merchandiser -f /docker-entrypoint-initdb.d/backup.dump || {
      echo "Alternative restore also failed. Database might already be populated."
    }
  }
  
  echo "Database restoration completed!"
else
  echo "No dump file found. Skipping restore."
fi

echo "Database initialization finished!"


