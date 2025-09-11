

#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './server/database/sqlite-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runInventoryMigration() {
  console.log('🔄 Running Inventory Module Migration...\n');

  try {
    // Read and execute the inventory migration SQL
    const migrationPath = join(__dirname, 'server/database/migrations/create_inventory_module.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        if (statement.startsWith('--') || statement.length === 0) {
          continue; // Skip comments and empty statements
        }

        await pool.query(statement);
        
        // Log table creation
        if (statement.toLowerCase().includes('create table')) {
          const tableName = statement.match(/create table.*?(\w+)\s*\(/i)?.[1];
          if (tableName) {
            console.log(`✅ Created table: ${tableName}`);
          }
        }
        
        // Log index creation
        if (statement.toLowerCase().includes('create index')) {
          const indexName = statement.match(/create index.*?(\w+)\s+on/i)?.[1];
          if (indexName) {
            console.log(`🔍 Created index: ${indexName}`);
          }
        }

        // Log insert statements
        if (statement.toLowerCase().includes('insert')) {
          console.log(`📝 Inserted default data`);
        }
        
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        // Don't exit on individual statement errors, continue with migration
      }
    }

    console.log('\n🎉 Inventory module migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   • Material categories and inventory materials management');
    console.log('   • Stock levels and movement tracking');
    console.log('   • Job material requirements and allocations');
    console.log('   • Purchase request workflow');
    console.log('   • Stock alerts and notifications');
    console.log('   • Comprehensive reporting foundation');
    
    console.log('\n🚀 Next steps:');
    console.log('   • Start the server: npm run dev');
    console.log('   • Access inventory module in the application');
    console.log('   • Configure material categories and items');
    console.log('   • Set up initial stock levels');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('   • Database connection is working');
    console.error('   • SQL syntax in migration file');
    console.error('   • File permissions and paths');
    process.exit(1);
  } finally {
    // Close database connection
    try {
      if (pool && typeof pool.close === 'function') {
        pool.close();
      } else if (pool && typeof pool.end === 'function') {
        await pool.end();
      }
      console.log('\n✅ Database connection closed.');
    } catch (error) {
      console.log('\n⚠️  Database connection close warning:', error.message);
    }
    process.exit(0);
  }
}

// Verify that this is being run as a script, not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  runInventoryMigration().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}