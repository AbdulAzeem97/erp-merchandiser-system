// Apply ALL SQL files to the database
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database credentials
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'erp_merchandiser',
  user: 'erp_user',
  password: 'DevPassword123!'
};

console.log('\n========================================');
console.log('📄 Applying ALL SQL Files to Database');
console.log('========================================\n');

// Find all SQL files
function findSqlFiles(dir) {
  const files = [];
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        files.push(...findSqlFiles(fullPath));
      } else if (item.endsWith('.sql')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
  return files;
}

async function applySqlFiles() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find all SQL files
    console.log('🔍 Searching for SQL files...\n');
    const allSqlFiles = findSqlFiles(__dirname);
    
    // Filter out backup and generated files
    const sqlFiles = allSqlFiles.filter(f => 
      !f.includes('node_modules') &&
      !f.includes('backups') &&
      !f.includes('logs') &&
      !f.includes('generated') &&
      !f.includes('backup_') &&
      !f.includes('temp_')
    );

    console.log(`📋 Found ${sqlFiles.length} SQL files to apply\n`);

    let successCount = 0;
    let alreadyExistsCount = 0;
    let errorCount = 0;

    // Important files first (in specific order)
    const priorityFiles = [
      'fix-all-products-columns.sql',
      'fix-products-table.sql',
      'fix-materials-columns.sql',
      'fix-job-cards-columns.sql',
      'fix-missing-columns.sql',
      'fix-process-selection-columns.sql',
      'fix-pps-columns-final.sql',
      'fix-product-process-selections.sql',
      'fix-product-process-selections-complete.sql',
      'fix-process-sequences.sql',
      'add-complete-process-steps.sql',
      'create-complete-process-data.sql',
      'fix-all-backend-errors.sql'
    ];

    // Process priority files first
    for (const priorityFile of priorityFiles) {
      const file = sqlFiles.find(f => f.endsWith(priorityFile));
      if (file) {
        await applyFile(file);
      }
    }

    // Then process all other files
    for (const file of sqlFiles) {
      const alreadyProcessed = priorityFiles.some(pf => file.endsWith(pf));
      if (!alreadyProcessed) {
        await applyFile(file);
      }
    }

    async function applyFile(file) {
      const fileName = file.split('\\').pop().split('/').pop();
      process.stdout.write(`  ${fileName.padEnd(50)} `);
      
      try {
        const sql = readFileSync(file, 'utf8');
        
        // Skip if empty or only comments
        const cleanSql = sql.replace(/--.*$/gm, '').trim();
        if (!cleanSql || cleanSql.length < 10) {
          console.log('⏭️  (empty)');
          return;
        }

        await client.query(sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        const errorMsg = err.message.toLowerCase();
        
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            err.code === '42P07' ||
            err.code === '42710') {
          console.log('✅ (exists)');
          alreadyExistsCount++;
        } else if (errorMsg.includes('does not exist') && 
                   errorMsg.includes('table')) {
          console.log('⏭️  (skip)');
        } else {
          console.log(`⚠️  ${err.message.split('\n')[0].substring(0, 40)}`);
          errorCount++;
        }
      }
    }

    await client.end();

    // Summary
    console.log('\n========================================');
    console.log('📊 Summary');
    console.log('========================================\n');
    console.log(`  Total files found: ${sqlFiles.length}`);
    console.log(`  ✅ Applied: ${successCount}`);
    console.log(`  ✅ Already exists: ${alreadyExistsCount}`);
    console.log(`  ⚠️  Errors: ${errorCount}`);
    console.log(`  ✅ Total successful: ${successCount + alreadyExistsCount}\n`);

    // Verify final state
    const verifyClient = new Client(DB_CONFIG);
    await verifyClient.connect();
    
    const tableResult = await verifyClient.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const columnResult = await verifyClient.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);

    console.log('📊 Database Status:');
    console.log(`  Tables: ${tableResult.rows[0].count}`);
    console.log(`  Columns: ${columnResult.rows[0].count}`);
    console.log('');

    await verifyClient.end();

    console.log('========================================');
    console.log('✅ ALL SQL FILES PROCESSED!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

applySqlFiles();

