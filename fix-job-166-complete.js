import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const getPool = () => {
  const user = process.env.DB_USER || process.env.PG_USER || 'erp_user';
  const host = process.env.DB_HOST || process.env.PG_HOST || 'localhost';
  const database = process.env.DB_NAME || process.env.PG_DATABASE || 'erp_merchandiser';
  const password = process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'secure_password_123';
  const port = process.env.DB_PORT || process.env.PG_PORT || 5432;

  return new Pool({
    user,
    host,
    database,
    password,
    port: parseInt(port),
  });
};

const pool = getPool();

async function fixJob166() {
  try {
    const jobId = 166;
    console.log(`\n🔧 Fixing job ${jobId} (JC-1767250497140)...\n`);

    // Step 1: Generate workflow steps if they don't exist
    const existingSteps = await pool.query(
      'SELECT COUNT(*) as count FROM job_workflow_steps WHERE job_card_id = $1',
      [jobId]
    );

    if (parseInt(existingSteps.rows[0].count) === 0) {
      console.log('📋 Step 1: Generating workflow steps...');
      const jobResult = await pool.query(
        'SELECT "productId" FROM job_cards WHERE id = $1',
        [jobId]
      );

      if (jobResult.rows.length > 0 && jobResult.rows[0].productId) {
        const { default: UnifiedWorkflowService } = await import('./server/services/unifiedWorkflowService.js');
        const workflowService = new UnifiedWorkflowService();
        await workflowService.generateWorkflowFromProduct(jobId, jobResult.rows[0].productId);
        console.log('✅ Workflow steps generated\n');
      } else {
        console.log('❌ Job has no product ID\n');
        return;
      }
    } else {
      console.log('✅ Workflow steps already exist\n');
    }

    // Step 2: Get all workflow steps
    const stepsResult = await pool.query(
      'SELECT id, step_name, department, status, sequence_number FROM job_workflow_steps WHERE job_card_id = $1 ORDER BY sequence_number',
      [jobId]
    );

    console.log('📊 Workflow Steps:');
    stepsResult.rows.forEach(step => {
      console.log(`   ${step.sequence_number}. ${step.step_name} (${step.department}) - ${step.status}`);
    });
    console.log('');

    // Step 3: Find and complete cutting step
    const cuttingStep = stepsResult.rows.find(step => 
      step.department === 'Cutting' || step.step_name?.toLowerCase().includes('cutting')
    );

    if (cuttingStep) {
      console.log(`✂️  Step 2: Marking cutting as completed...`);
      if (cuttingStep.status !== 'completed') {
        await pool.query(`
          UPDATE job_workflow_steps
          SET 
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [cuttingStep.id]);
        console.log('✅ Cutting step marked as completed\n');
      } else {
        console.log('✅ Cutting step already completed\n');
      }
    } else {
      console.log('⚠️  No cutting step found\n');
    }

    // Step 4: Find Offset Printing step
    const offsetStep = stepsResult.rows.find(step => 
      step.step_name?.toLowerCase().includes('offset printing') ||
      step.department === 'Offset Printing'
    );

    if (offsetStep) {
      console.log(`🖨️  Step 3: Activating Offset Printing...`);
      console.log(`   Found: ${offsetStep.step_name} (${offsetStep.department})`);
      console.log(`   Current status: ${offsetStep.status}`);
      
      if (offsetStep.status === 'inactive' || offsetStep.status === 'pending') {
        await pool.query(`
          UPDATE job_workflow_steps
          SET 
            status = 'pending',
            status_message = 'Pending in Offset Printing',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [offsetStep.id]);

        // Update job_cards
        await pool.query(`
          UPDATE job_cards
          SET 
            current_department = 'Offset Printing',
            current_step = $1,
            workflow_status = 'pending',
            status_message = 'Pending in Offset Printing',
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [offsetStep.step_name, jobId]);

        console.log('✅ Offset Printing activated!');
        console.log('   Job should now appear in Offset Printing dashboard\n');
      } else {
        console.log(`✅ Offset Printing step is already active (status: ${offsetStep.status})\n`);
      }
    } else {
      console.log('❌ No Offset Printing step found in workflow');
      console.log('   The product\'s process sequence may not include Offset Printing\n');
    }

    // Step 5: Verify final status
    const finalStatus = await pool.query(
      'SELECT current_department, current_step, workflow_status FROM job_cards WHERE id = $1',
      [jobId]
    );

    if (finalStatus.rows.length > 0) {
      console.log('📋 Final Job Status:');
      console.log(`   Department: ${finalStatus.rows[0].current_department}`);
      console.log(`   Step: ${finalStatus.rows[0].current_step}`);
      console.log(`   Workflow Status: ${finalStatus.rows[0].workflow_status}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function main() {
  try {
    await fixJob166();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();



