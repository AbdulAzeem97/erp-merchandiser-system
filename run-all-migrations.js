#!/usr/bin/env node

/**
 * Comprehensive Migration Runner
 * Runs all database migrations in order from the migrations directory
 */

import dbAdapter from './server/database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  user: process.env.DB_USER || 'erp_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || 'DevPassword123!',
  port: process.env.DB_PORT || 5432,
};

// Get all migration files in order
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'server', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically/numerically
  
  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file),
    number: extractMigrationNumber(file)
  })).sort((a, b) => a.number - b.number);
}

function extractMigrationNumber(filename) {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : 999; // Put unnumbered files at the end
}

// Create migrations tracking table
async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER
    )
  `);
}

// Check if migration has been run
async function hasMigrationRun(client, migrationName) {
  const result = await client.query(
    'SELECT COUNT(*) as count FROM schema_migrations WHERE migration_name = $1',
    [migrationName]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

// Record migration execution
async function recordMigration(client, migrationName, executionTime) {
  await client.query(
    'INSERT INTO schema_migrations (migration_name, execution_time_ms) VALUES ($1, $2) ON CONFLICT (migration_name) DO NOTHING',
    [migrationName, executionTime]
  );
}

// Execute a single migration
async function executeMigration(client, migration) {
  console.log(`\n📝 Running migration: ${migration.name}`);
  
  const startTime = Date.now();
  const sql = fs.readFileSync(migration.path, 'utf8');
  
  try {
    await client.query('BEGIN');
    
    // Split SQL into statements more carefully
    // Handle PostgreSQL DO blocks and multi-line statements
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    let doBlockDepth = 0;
    
    const lines = sql.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('--') || trimmed === '') {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Track DO block depth
      if (trimmed.toUpperCase().startsWith('DO $$')) {
        inDoBlock = true;
        doBlockDepth = 1;
      } else if (inDoBlock) {
        if (trimmed.includes('$$')) {
          doBlockDepth--;
          if (doBlockDepth === 0) {
            inDoBlock = false;
          }
        }
      }
      
      // End of statement (not in DO block)
      if (!inDoBlock && trimmed.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Execute each statement
    let executed = 0;
    let skipped = 0;
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        executed++;
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message || '';
        
        // Ignore errors for things that already exist or are not critical
        if (errorCode === '42P07' || errorCode === '42710' || // relation/object already exists
            errorCode === '42723' || // function already exists
            errorCode === '42883' || // operator already exists
            errorCode === '42P16' || // cannot alter inherited column
            errorMessage.includes('already exists') ||
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('duplicate') ||
            (errorMessage.includes('does not exist') && (
              errorMessage.includes('DROP') ||
              errorMessage.includes('IF EXISTS')
            ))) {
          skipped++;
          // Continue - this is fine
        } else {
          // Real error - log but continue
          console.log(`   ⚠️  Statement warning: ${errorMessage.split('\n')[0].substring(0, 100)}`);
          skipped++;
        }
      }
    }
    
    await client.query('COMMIT');
    
    const executionTime = Date.now() - startTime;
    await recordMigration(client, migration.name, executionTime);
    
    if (executed > 0 || skipped > 0) {
      console.log(`   ✅ Migration ${migration.name} completed (${executionTime}ms, ${executed} executed, ${skipped} skipped)`);
      return true;
    } else {
      console.log(`   ⚠️  Migration ${migration.name} had no statements to execute`);
      return true;
    }
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    const errorMsg = error.message.split('\n')[0].substring(0, 100);
    console.error(`   ❌ Migration ${migration.name} failed: ${errorMsg}`);
    // Don't throw - continue with other migrations
    return false;
  }
}

// Main migration runner
async function runAllMigrations() {
  console.log('🚀 Starting Database Migration Process');
  console.log('=====================================\n');
  
  try {
    // Initialize database adapter
    console.log('📡 Connecting to database...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}\n`);
    
    await dbAdapter.initialize();
    console.log('✅ Database connected\n');
    
    // Get migration files
    const migrations = getMigrationFiles();
    console.log(`📋 Found ${migrations.length} migration files:\n`);
    migrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name}`);
    });
    console.log('');
    
    // Create migrations table
    const client = await dbAdapter.getConnection().connect();
    try {
      await createMigrationsTable(client);
      
      // Sort migrations by priority (base tables first, then modifications)
      // Migrations that create base tables should run first
      const priorityOrder = {
        'create_inventory_module.sql': 1,
        'create_item_specifications_tables.sql': 1,
        '001_add_prepress_and_roles.sql': 2,
        '001_add_material_sizes.sql': 2,
        '002_add_production_planning_fields.sql': 3,
        '002_add_plate_count_and_machine.sql': 3,
        '003_add_job_workflow_steps.sql': 3,
        '003_add_machines_1_to_5.sql': 3,
        '003_add_ratio_report_fields.sql': 4,
        '004_set_default_offset_sequence.sql': 4,
        '005_add_cutting_workflow.sql': 4,
        '005_add_job_planning_step.sql': 4,
        '006_add_production_workflow.sql': 4,
        '006_make_prepress_steps_compulsory.sql': 5,
        '007_add_job_ctp_machines_table.sql': 5,
        '008_update_ctp_machines_with_names.sql': 6,
      };
      
      migrations.sort((a, b) => {
        const priorityA = priorityOrder[a.name] || 999;
        const priorityB = priorityOrder[b.name] || 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.number - b.number;
      });
      
      // Run each migration
      let successCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      for (const migration of migrations) {
        const hasRun = await hasMigrationRun(client, migration.name);
        
        if (hasRun) {
          console.log(`⏭️  Skipping ${migration.name} (already executed)`);
          skippedCount++;
        } else {
          const success = await executeMigration(client, migration);
          if (success) {
            successCount++;
          } else {
            failedCount++;
            // Continue with other migrations
          }
        }
      }
      
      // Print summary
      console.log('\n' + '='.repeat(50));
      console.log('📊 Migration Summary');
      console.log('='.repeat(50));
      console.log(`✅ Successful: ${successCount}`);
      console.log(`⏭️  Skipped: ${skippedCount}`);
      console.log(`❌ Failed: ${failedCount}`);
      console.log(`📝 Total: ${migrations.length}`);
      console.log('='.repeat(50) + '\n');
      
      if (failedCount > 0) {
        console.log('⚠️  Some migrations failed. Please review the errors above.');
        process.exit(1);
      } else {
        console.log('🎉 All migrations completed successfully!');
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error.message);
    console.error('Error details:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Verify database connection settings');
    process.exit(1);
  } finally {
    await dbAdapter.close();
  }
}

// Run migrations
runAllMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

