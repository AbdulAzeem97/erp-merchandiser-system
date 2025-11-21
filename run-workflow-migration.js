import dbAdapter from './server/database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runWorkflowMigration() {
  try {
    console.log('🔄 Running workflow migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'server', 'database', 'migrations', '003_add_job_workflow_steps.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    for (const statement of statements) {
      try {
        await dbAdapter.query(statement);
        console.log('✅ Executed migration statement');
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') && 
            !error.message.includes('IF NOT EXISTS')) {
          console.error('❌ Error:', error.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }
    
    console.log('✅ Workflow migration completed successfully!');
    
    // Migrate existing jobs to have workflow steps
    console.log('\n🔄 Migrating existing jobs to workflow system...');
    
    const jobsResult = await dbAdapter.query(`
      SELECT id, "productId", status FROM job_cards
      WHERE id NOT IN (SELECT DISTINCT job_card_id FROM job_workflow_steps)
      LIMIT 100
    `);
    
    if (jobsResult.rows.length > 0) {
      const UnifiedWorkflowService = (await import('./server/services/unifiedWorkflowService.js')).default;
      const workflowService = new UnifiedWorkflowService();
      
      for (const job of jobsResult.rows) {
        try {
          await workflowService.generateWorkflowFromProduct(job.id, job.productId);
          console.log(`✅ Migrated job ${job.id}`);
        } catch (error) {
          console.error(`❌ Error migrating job ${job.id}:`, error.message);
        }
      }
      
      console.log(`✅ Migrated ${jobsResult.rows.length} existing jobs`);
    } else {
      console.log('✅ No jobs need migration');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runWorkflowMigration();

