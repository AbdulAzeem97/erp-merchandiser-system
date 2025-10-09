#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
port="$2"
shift 2

echo "⏳ Waiting for PostgreSQL to be ready at $host:$port..."

until PGPASSWORD=$DB_PASSWORD psql -h "$host" -p "$port" -U "$DB_USER" -d "postgres" -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

>&2 echo "✅ PostgreSQL is up and running!"

# Check if database exists
echo "📊 Checking database..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$host" -p "$port" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "0" ]; then
  echo "🔨 Creating database $DB_NAME..."
  PGPASSWORD=$DB_PASSWORD psql -h "$host" -p "$port" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;"
fi

# Check if tables exist
echo "📋 Checking if tables exist..."
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$host" -p "$port" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ "$TABLE_COUNT" -lt "10" ]; then
  echo "🔧 Setting up database schema..."
  PGPASSWORD=$DB_PASSWORD psql -h "$host" -p "$port" -U "$DB_USER" -d "$DB_NAME" -f database-setup-complete.sql
  
  echo "🌱 Seeding database with initial data..."
  node seed-complete-database.js
  
  echo "✅ Database setup completed!"
else
  echo "✅ Database already initialized with $TABLE_COUNT tables"
fi

echo "🚀 Starting application server..."

