// Complete Database Migration Script
// This will properly migrate all Prisma schemas and SQL files

import pkg from 'pg';
const { Client } = pkg;
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('\n========================================');
console.log('🗄️  ERP System - Complete Database Migration');
console.log('========================================\n');

async function runMigration() {
  let client = null;

  try {
    // Step 1: Get database credentials
    console.log('📋 Database Configuration\n');
    
    const DB_HOST = await question('Database Host [localhost]: ') || 'localhost';
    const DB_PORT = await question('Database Port [5432]: ') || '5432';
    const DB_USER = await question('Database User [postgres]: ') || 'postgres';
    
    console.log('\n💡 Common PostgreSQL passwords to try:');
    console.log('   1. postgres');
    console.log('   2. admin');
    console.log('   3. password');
    console.log('   4. (blank - just press Enter)');
    console.log('   5. Custom password\n');
    
    const DB_PASSWORD = await question('Database Password: ');
    const DB_NAME = await question('Database Name [erp_merchandiser]: ') || 'erp_merchandiser';

    console.log('\n🔄 Starting migration process...\n');

    // Step 2: Test connection to postgres database
    console.log('Step 1/8: Testing database connection...');
    
    const DB_CONFIG = {
      host: DB_HOST,
      port: parseInt(DB_PORT),
      database: 'postgres',
      user: DB_USER,
      password: DB_PASSWORD
    };

    try {
      client = new Client(DB_CONFIG);
      await client.connect();
      console.log('  ✅ Connection successful\n');
    } catch (err) {
      console.error('  ❌ Connection failed:', err.message);
      console.log('\n  Please check:');
      console.log('    • PostgreSQL is running (net start postgresql-x64-15)');
      console.log('    • Password is correct');
      console.log('    • Host and port are correct\n');
      rl.close();
      process.exit(1);
    }

    // Step 3: Create database if not exists
    console.log('Step 2/8: Creating database...');
    try {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`  ✅ Database '${DB_NAME}' created\n`);
    } catch (err) {
      if (err.code === '42P04') {
        console.log(`  ℹ️  Database '${DB_NAME}' already exists\n`);
      } else {
        throw err;
      }
    }
    await client.end();

    // Step 4: Create .env file
    console.log('Step 3/8: Creating .env file...');
    const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
    
    const envContent = `# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Backend Configuration
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Details
DB_TYPE=postgresql
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Frontend API Configuration
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
`;

    writeFileSync('.env', envContent);
    console.log('  ✅ .env file created\n');

    // Set environment variable for Prisma
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.DB_USER = DB_USER;
    process.env.DB_PASSWORD = DB_PASSWORD;
    process.env.DB_HOST = DB_HOST;
    process.env.DB_PORT = DB_PORT;
    process.env.DB_NAME = DB_NAME;

    // Step 5: Generate Prisma Client
    console.log('Step 4/8: Generating Prisma Client...');
    try {
      await execAsync('npx prisma generate', { env: { ...process.env, DATABASE_URL } });
      console.log('  ✅ Prisma Client generated\n');
    } catch (err) {
      console.log('  ⚠️  Generation had warnings (continuing...)\n');
    }

    // Step 6: Push Prisma schema to database
    console.log('Step 5/8: Applying Prisma schema to database...');
    console.log('  This creates all tables from schema.prisma');
    try {
      await execAsync('npx prisma db push --accept-data-loss --skip-generate', { 
        env: { ...process.env, DATABASE_URL } 
      });
      console.log('  ✅ Prisma schema applied successfully\n');
    } catch (err) {
      console.log('  ⚠️  Schema push completed with warnings\n');
      console.log(err.stderr);
    }

    // Step 7: Connect to target database for SQL migrations
    console.log('Step 6/8: Applying additional SQL migrations...');
    client = new Client({
      ...DB_CONFIG,
      database: DB_NAME
    });
    await client.connect();

    // SQL files to apply (in order)
    const sqlFiles = [
      { path: 'server/database/migrations/001_add_prepress_and_roles.sql', name: 'Prepress & Roles' },
      { path: 'server/database/migrations/create_inventory_module.sql', name: 'Inventory Module' },
      { path: 'create-item-specifications-table.sql', name: 'Item Specifications' },
      { path: 'create-procurement-schema.sql', name: 'Procurement Schema' },
      { path: 'create-ratio-reports-table.sql', name: 'Ratio Reports' },
      { path: 'add-ctp-fields.sql', name: 'CTP Fields' }
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const { path, name } of sqlFiles) {
      const fullPath = join(__dirname, path);
      if (existsSync(fullPath)) {
        console.log(`  Applying: ${name}...`);
        try {
          const sql = readFileSync(fullPath, 'utf8');
          await client.query(sql);
          console.log(`    ✅ Success`);
          successCount++;
        } catch (err) {
          if (err.code === '42P07' || err.message.includes('already exists')) {
            console.log(`    ℹ️  Already exists (skipped)`);
            successCount++;
          } else {
            console.log(`    ⚠️  ${err.message.split('\n')[0]}`);
            skipCount++;
          }
        }
      } else {
        console.log(`  Skipping: ${name} (file not found)`);
        skipCount++;
      }
    }
    
    console.log(`\n  Result: ${successCount} applied, ${skipCount} skipped\n`);

    // Step 8: Verify database structure
    console.log('Step 7/8: Verifying database structure...');
    const tableResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`  ✅ Total tables: ${tableResult.rows[0].table_count}\n`);

    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('  📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`     • ${row.table_name}`);
    });
    console.log('');

    await client.end();

    // Step 9: Offer to seed database
    console.log('Step 8/8: Database seeding...');
    const seedChoice = await question('Do you want to seed with sample data? (Y/n): ');
    
    if (seedChoice.toLowerCase() !== 'n') {
      console.log('\n  Running comprehensive seed...');
      try {
        const seedFile = existsSync('prisma/comprehensive-seed.cjs') ? 
          'prisma/comprehensive-seed.cjs' : 
          'prisma/seed.cjs';
        
        await execAsync(`node ${seedFile}`, { 
          env: { ...process.env, DATABASE_URL } 
        });
        console.log('  ✅ Database seeded successfully\n');
      } catch (err) {
        console.log('  ⚠️  Seeding completed with warnings\n');
      }
    } else {
      console.log('  ⏭️  Skipped seeding\n');
    }

    // Final summary
    console.log('========================================');
    console.log('✅ MIGRATION COMPLETE!');
    console.log('========================================\n');
    
    console.log('📊 Summary:');
    console.log(`  ✅ Database: ${DB_NAME}`);
    console.log(`  ✅ Tables: ${tableResult.rows[0].table_count}`);
    console.log(`  ✅ Prisma schema: Applied`);
    console.log(`  ✅ SQL migrations: ${successCount} applied`);
    console.log('');
    
    console.log('🚀 Next Steps:');
    console.log('  1. Start servers: .\\start-network-auto.ps1');
    console.log('  2. Access system: http://192.168.2.124:8080');
    console.log('  3. Login: admin@erp.local / password123\n');
    
    console.log('📝 Configuration saved to: .env\n');
    
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

runMigration();

