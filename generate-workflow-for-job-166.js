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

async function generateWorkflowForJob(jobId) {
  try {
    console.log(`\n🔍 Checking job ${jobId}...\n`);

    // Get job info
    const jobResult = await pool.query(
      'SELECT id, "jobNumber", "productId" FROM job_cards WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      console.log(`❌ Job ${jobId} not found`);
      return;
    }

    const job = jobResult.rows[0];
    console.log(`📋 Job: ${job.jobNumber}`);
    console.log(`   Product ID: ${job.productId}\n`);

    if (!job.productId) {
      console.log(`❌ Job has no product ID, cannot generate workflow`);
      return;
    }

    // Check if workflow steps already exist
    const existingSteps = await pool.query(
      'SELECT COUNT(*) as count FROM job_workflow_steps WHERE job_card_id = $1',
      [jobId]
    );

    if (parseInt(existingSteps.rows[0].count) > 0) {
      console.log(`⚠️  Workflow steps already exist for this job`);
      return;
    }

    console.log(`🔄 Generating workflow steps from product process sequence...\n`);

    // Import and use UnifiedWorkflowService
    const { default: UnifiedWorkflowService } = await import('./server/services/unifiedWorkflowService.js');
    const workflowService = new UnifiedWorkflowService();
    
    await workflowService.generateWorkflowFromProduct(jobId, job.productId);
    
    console.log(`✅ Workflow steps generated!\n`);

    // Check the generated steps
    const stepsResult = await pool.query(
      'SELECT step_name, department, status, sequence_number FROM job_workflow_steps WHERE job_card_id = $1 ORDER BY sequence_number',
      [jobId]
    );

    console.log(`📊 Generated Workflow Steps (${stepsResult.rows.length} total):`);
    stepsResult.rows.forEach(step => {
      console.log(`   ${step.sequence_number}. ${step.step_name} (${step.department}) - ${step.status}`);
    });

    // Check for Offset Printing
    const offsetStep = stepsResult.rows.find(step => 
      step.step_name?.toLowerCase().includes('offset printing') ||
      step.department === 'Offset Printing'
    );

    if (offsetStep) {
      console.log(`\n✅ Found Offset Printing step:`);
      console.log(`   Step: ${offsetStep.step_name}`);
      console.log(`   Department: ${offsetStep.department}`);
      console.log(`   Status: ${offsetStep.status}`);
      console.log(`   Sequence: ${offsetStep.sequence_number}`);
      
      if (offsetStep.status === 'inactive') {
        console.log(`\n⚠️  Offset Printing step is inactive. It will be activated when cutting is completed.`);
      }
    } else {
      console.log(`\n⚠️  No Offset Printing step found in the generated workflow.`);
      console.log(`   The product's process sequence may not include Offset Printing.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function main() {
  const jobId = process.argv[2] || 166;
  
  try {
    await generateWorkflowForJob(jobId);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();



