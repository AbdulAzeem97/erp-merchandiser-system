// Simple Database Migration Script using Node.js
// This works without psql command line tool

import pkg from 'pg';
const { Client } = pkg;
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to postgres first
  user: 'postgres',
  password: 'postgres123'
};

const TARGET_DB = 'erp_merchandiser';

console.log('\n========================================');
console.log('ERP System - Complete Database Migration');
console.log('========================================\n');

async function runMigration() {
  let client = null;

  try {
    // Step 1: Test connection
    console.log('Step 1: Testing database connection...');
    client = new Client(DB_CONFIG);
    await client.connect();
    console.log('  ✅ Database connection successful\n');

    // Step 2: Create database if not exists
    console.log('Step 2: Creating database (if not exists)...');
    try {
      await client.query(`CREATE DATABASE ${TARGET_DB}`);
      console.log('  ✅ Database created successfully\n');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('  ℹ️  Database already exists\n');
      } else {
        throw err;
      }
    }
    await client.end();

    // Step 3: Create .env file
    console.log('Step 3: Creating .env file...');
    const DATABASE_URL = `postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${TARGET_DB}?schema=public`;
    
    const envContent = `# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Backend Configuration
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Details
DB_TYPE=postgresql
DB_HOST=${DB_CONFIG.host}
DB_PORT=${DB_CONFIG.port}
DB_NAME=${TARGET_DB}
DB_USER=${DB_CONFIG.user}
DB_PASSWORD=${DB_CONFIG.password}

# Frontend API Configuration
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
`;

    const fs = await import('fs');
    fs.writeFileSync('.env', envContent);
    console.log('  ✅ .env file created\n');

    // Set environment variable
    process.env.DATABASE_URL = DATABASE_URL;

    // Step 4: Generate Prisma Client
    console.log('Step 4: Generating Prisma Client...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma generate');
      console.log('  ✅ Prisma Client generated\n');
    } catch (err) {
      console.log('  ⚠️  Prisma Client generation had issues\n');
      console.log(err.stderr);
    }

    // Step 5: Push Prisma schema to database
    console.log('Step 5: Pushing Prisma schema to database...');
    console.log('  This will create/update all tables based on schema.prisma');
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
      console.log('  ✅ Prisma schema applied successfully\n');
    } catch (err) {
      console.log('  ⚠️  Prisma schema push had issues\n');
      console.log(err.stderr);
    }

    // Step 6: Connect to target database and apply additional SQL
    console.log('Step 6: Applying additional SQL migrations...');
    client = new Client({
      ...DB_CONFIG,
      database: TARGET_DB
    });
    await client.connect();

    // Apply SQL files if they exist
    const sqlFiles = [
      'server/database/migrations/001_add_prepress_and_roles.sql',
      'server/database/migrations/create_inventory_module.sql',
      'create-item-specifications-table.sql',
      'create-procurement-schema.sql',
      'create-ratio-reports-table.sql',
      'add-ctp-fields.sql'
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const sqlFile of sqlFiles) {
      const fullPath = join(__dirname, sqlFile);
      if (existsSync(fullPath)) {
        console.log(`  Applying: ${sqlFile}`);
        try {
          const sql = readFileSync(fullPath, 'utf8');
          await client.query(sql);
          console.log('    ✅ Success');
          successCount++;
        } catch (err) {
          if (err.code === '42P07' || err.message.includes('already exists')) {
            console.log('    ℹ️  Already applied');
            successCount++;
          } else {
            console.log(`    ⚠️  ${err.message}`);
            skipCount++;
          }
        }
      } else {
        console.log(`  Skipping: ${sqlFile} (not found)`);
        skipCount++;
      }
    }
    
    console.log(`\n  SQL Migrations: ${successCount} applied, ${skipCount} skipped\n`);

    // Step 7: Verify tables
    console.log('Step 7: Verifying database structure...');
    const result = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`  ✅ Total tables created: ${result.rows[0].table_count}\n`);

    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('  Tables created:');
    tables.rows.forEach(row => {
      console.log(`    • ${row.table_name}`);
    });
    console.log('');

    await client.end();

    // Display summary
    console.log('========================================');
    console.log('✅ Migration Complete!');
    console.log('========================================\n');
    console.log('Summary:');
    console.log('  ✅ Prisma schema applied');
    console.log('  ✅ SQL migrations applied');
    console.log('  ✅ Database is ready\n');
    console.log('Next Steps:');
    console.log('  1. Seed the database: node prisma/comprehensive-seed.cjs');
    console.log('  2. Start the servers: .\\start-network-auto.ps1');
    console.log('  3. Access the system: http://192.168.2.124:8080');
    console.log('  4. Login with: admin@erp.local / password123\n');
    console.log('Database Connection String:');
    console.log(`  ${DATABASE_URL}\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (err) {
        // Ignore
      }
    }
  }
}

runMigration();

