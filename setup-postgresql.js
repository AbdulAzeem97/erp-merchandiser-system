#!/usr/bin/env node

console.log('🚀 POSTGRESQL MIGRATION SETUP');
console.log('================================');

console.log('\n📋 STEP 1: Install PostgreSQL');
console.log('Download and install PostgreSQL from: https://www.postgresql.org/download/windows/');
console.log('Or use Chocolatey: choco install postgresql');
console.log('Or use Docker: docker run --name postgres-erp -e POSTGRES_PASSWORD=secure_password_123 -p 5432:5432 -d postgres:15');

console.log('\n📋 STEP 2: Create Database and User');
console.log('Run these commands in PostgreSQL:');
console.log(`
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE erp_merchandiser;
CREATE USER erp_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE erp_merchandiser TO erp_user;
\\q
`);

console.log('\n📋 STEP 3: Environment Variables');
console.log('Add these to your .env file:');
console.log(`
# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=erp_merchandiser
PG_USER=erp_user
PG_PASSWORD=secure_password_123
PG_MAX_CONNECTIONS=20
PG_IDLE_TIMEOUT=30000
PG_CONNECTION_TIMEOUT=2000

# Existing Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3002
NODE_ENV=development

# Frontend Configuration
VITE_API_BASE_URL=http://192.168.2.56:3002/api
VITE_API_URL=http://192.168.2.56:3002
`);

console.log('\n📋 STEP 4: Run Migration');
console.log('After PostgreSQL is installed and configured, run:');
console.log('node migrate-to-postgresql.js');

console.log('\n📋 STEP 5: Update Server Configuration');
console.log('The server will automatically use PostgreSQL when the environment variables are set.');

console.log('\n✅ All migration files are ready!');
console.log('📁 Files created:');
console.log('  - postgresql-schema.sql (Database schema)');
console.log('  - migrate-to-postgresql.js (Migration script)');
console.log('  - server/database/postgresql.js (Database layer)');
console.log('  - server/config/database.js (Configuration)');
console.log('  - POSTGRESQL_MIGRATION_GUIDE.md (Complete guide)');

console.log('\n🎯 Next Steps:');
console.log('1. Install PostgreSQL');
console.log('2. Create database and user');
console.log('3. Add environment variables');
console.log('4. Run migration script');
console.log('5. Start your application');

console.log('\n🚀 Your ERP system will be ready for 200+ users!');

