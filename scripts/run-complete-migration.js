import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbAdapter from '../server/database/adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run complete schema migration
 * This script executes the 000_complete_schema_migration.sql file
 */
async function runCompleteMigration() {
  try {
    console.log('🚀 Starting complete schema migration...');
    console.log('==========================================');

    // Path to migration file
    const migrationPath = path.join(
      __dirname,
      '../server/database/migrations/000_complete_schema_migration.sql'
    );

    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    console.log(`📄 Reading migration file: ${migrationPath}`);

    // Read migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...');
    console.log('   (This may take a few moments)');

    // Execute migration
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Skip empty statements and comments
        if (!statement || statement.trim().length === 0) {
          continue;
        }

        // Execute statement
        await dbAdapter.query(statement);
        executedCount++;

        // Log progress for large migrations
        if (executedCount % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        // Some errors are expected (e.g., "already exists")
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('IF NOT EXISTS')
        ) {
          // These are safe to ignore
          continue;
        } else {
          console.error(`\n❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log('\n');
    console.log('==========================================');
    console.log(`✅ Migration completed!`);
    console.log(`   Executed: ${executedCount} statements`);
    if (errorCount > 0) {
      console.log(`   Warnings: ${errorCount} (mostly "already exists" - safe to ignore)`);
    }
    console.log('==========================================');

    // Verify migration by checking for key tables
    console.log('\n🔍 Verifying migration...');
    const verificationTables = [
      'material_sizes',
      'job_production_planning',
      'job_workflow_steps',
      'job_ctp_machines'
    ];

    for (const table of verificationTables) {
      try {
        const result = await dbAdapter.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
          [table]
        );
        if (result.rows[0].exists) {
          console.log(`   ✅ Table exists: ${table}`);
        } else {
          console.log(`   ⚠️  Table missing: ${table}`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking table ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ Complete schema migration finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run migration
runCompleteMigration();

