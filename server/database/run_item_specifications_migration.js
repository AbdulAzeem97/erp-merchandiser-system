import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    user: 'erp_user',
    host: 'localhost',
    database: 'erp_merchandiser',
    password: 'DevPassword123!',
    port: 5432,
  });

  try {
    console.log('🔄 Running item_specifications migration...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_item_specifications_tables.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements and execute
    // Remove comments and split by semicolons
    const cleanedMigration = migration
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    const statements = cleanedMigration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`);
          await pool.query(statement + ';');
          console.log(`  ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Ignore table/index already exists errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.code === '42P07' || // duplicate_table
              error.code === '42710' || // duplicate_object
              error.code === '42P17') { // duplicate schema
            console.log(`  ⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`  ❌ Statement ${i + 1} failed:`, error.message);
            console.error(`  Statement was: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Item specifications migration completed successfully!');
    
    // Verify tables were created
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('item_specifications', 'item_specification_items')
    `);
    
    console.log(`✅ Verified tables exist: ${checkTables.rows.map(r => r.table_name).join(', ')}`);
    
    await pool.end();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

