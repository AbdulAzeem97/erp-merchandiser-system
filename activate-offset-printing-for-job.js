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

async function findAndActivateOffsetPrinting(jobId) {
  try {
    console.log(`\n🔍 Checking job ${jobId}...\n`);

    // Get job info
    const jobResult = await pool.query(
      'SELECT id, "jobNumber", current_department, current_step FROM job_cards WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      console.log(`❌ Job ${jobId} not found`);
      return;
    }

    const job = jobResult.rows[0];
    console.log(`📋 Job: ${job.jobNumber}`);
    console.log(`   Current Department: ${job.current_department}`);
    console.log(`   Current Step: ${job.current_step}\n`);

    // Get all workflow steps
    const stepsResult = await pool.query(
      'SELECT id, step_name, department, status, sequence_number FROM job_workflow_steps WHERE job_card_id = $1 ORDER BY sequence_number',
      [jobId]
    );

    console.log(`📊 Workflow Steps (${stepsResult.rows.length} total):`);
    stepsResult.rows.forEach(step => {
      console.log(`   ${step.sequence_number}. ${step.step_name} (${step.department}) - ${step.status}`);
    });

    // Find Offset Printing step
    const offsetStep = stepsResult.rows.find(step => 
      step.step_name?.toLowerCase().includes('offset printing') ||
      step.step_name === 'Offset Printing' ||
      step.department === 'Offset Printing'
    );

    if (!offsetStep) {
      console.log(`\n❌ No Offset Printing step found for this job`);
      console.log(`   The job may not have Offset Printing in its process sequence.`);
      return;
    }

    console.log(`\n✅ Found Offset Printing step:`);
    console.log(`   Step: ${offsetStep.step_name}`);
    console.log(`   Department: ${offsetStep.department}`);
    console.log(`   Status: ${offsetStep.status}`);
    console.log(`   Sequence: ${offsetStep.sequence_number}`);

    // Find cutting step
    const cuttingStep = stepsResult.rows.find(step => 
      step.department === 'Cutting' || step.step_name?.toLowerCase().includes('cutting')
    );

    if (!cuttingStep) {
      console.log(`\n❌ No Cutting step found for this job`);
      return;
    }

    console.log(`\n📋 Cutting step:`);
    console.log(`   Step: ${cuttingStep.step_name}`);
    console.log(`   Status: ${cuttingStep.status}`);
    console.log(`   Sequence: ${cuttingStep.sequence_number}`);

    // Check if cutting is completed
    if (cuttingStep.status !== 'completed') {
      console.log(`\n⚠️  Cutting step is not completed yet (status: ${cuttingStep.status})`);
      console.log(`   Please complete cutting first, then this script will activate Offset Printing.`);
      return;
    }

    // Check if Offset Printing step is inactive
    if (offsetStep.status === 'inactive') {
      console.log(`\n⚠️  Offset Printing step is marked as 'inactive'`);
      console.log(`   This means it wasn't selected in the process sequence.`);
      console.log(`   Activating it now...`);
      
      // Update the step to pending
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

      console.log(`✅ Offset Printing step activated!`);
      console.log(`   Job should now appear in Offset Printing dashboard.`);
    } else if (offsetStep.status === 'pending' || offsetStep.status === 'in_progress') {
      console.log(`\n✅ Offset Printing step is already active (status: ${offsetStep.status})`);
      console.log(`   Job should appear in Offset Printing dashboard.`);
    } else {
      console.log(`\n⚠️  Offset Printing step has unexpected status: ${offsetStep.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  const jobId = process.argv[2];
  
  if (!jobId) {
    console.log('Usage: node activate-offset-printing-for-job.js <jobId>');
    console.log('\nExample: node activate-offset-printing-for-job.js 181');
    process.exit(1);
  }

  try {
    await findAndActivateOffsetPrinting(jobId);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();



