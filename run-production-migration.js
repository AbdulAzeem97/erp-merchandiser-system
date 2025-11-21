import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function runProductionMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running Production Workflow Migration...\n');
    
    const migrationPath = path.join(__dirname, 'server', 'database', 'migrations', '006_add_production_workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✅ Production workflow migration completed successfully!');
    
    // Verify tables were created
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('production_machines', 'production_assignments')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created Tables:');
    tablesCheck.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Check machine count
    const machineCount = await client.query('SELECT COUNT(*) as count FROM production_machines');
    console.log(`\n📊 Production Machines: ${machineCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runProductionMigration();
