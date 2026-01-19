import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { getDepartmentForStep } from './server/config/workflowMapping.js';

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

async function generateWorkflowFromSelections(jobId) {
  try {
    console.log(`\n🔄 Generating workflow steps for job ${jobId} from process selections...\n`);

    // Get selected process steps
    const selectionsResult = await pool.query(`
      SELECT 
        jps."processStepId",
        pst.name as step_name,
        pst."stepNumber" as step_order
      FROM job_process_selections jps
      JOIN process_steps pst ON jps."processStepId" = pst.id
      WHERE jps."jobId" = $1
        AND jps.is_selected = true
      ORDER BY pst."stepNumber" ASC
    `, [jobId]);

    if (selectionsResult.rows.length === 0) {
      console.log('❌ No selected process steps found for this job');
      return;
    }

    console.log(`📋 Found ${selectionsResult.rows.length} selected process steps:`);
    selectionsResult.rows.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.step_name} (order: ${step.step_order})`);
    });
    console.log('');

    // Generate workflow steps
    const workflowSteps = [];
    for (let i = 0; i < selectionsResult.rows.length; i++) {
      const step = selectionsResult.rows[i];
      const stepName = step.step_name;
      const sequenceNumber = i + 1;
      
      // Determine department using workflow mapping
      const department = getDepartmentForStep(stepName);
      
      // Determine initial status
      let status = 'inactive';
      if (sequenceNumber === 1) {
        status = 'pending';
      }

      workflowSteps.push({
        job_card_id: jobId,
        sequence_number: sequenceNumber,
        step_name: stepName,
        department: department,
        requires_qa: false,
        auto_action: false,
        status: status,
        status_message: `Pending in ${stepName} (${department})`
      });
    }

    console.log('📊 Generated workflow steps:');
    workflowSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.step_name} (${step.department}) - ${step.status}`);
    });
    console.log('');

    // Insert workflow steps
    console.log('💾 Inserting workflow steps into database...');
    for (const step of workflowSteps) {
      await pool.query(`
        INSERT INTO job_workflow_steps (
          job_card_id,
          sequence_number,
          step_name,
          department,
          requires_qa,
          auto_action,
          status,
          status_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (job_card_id, sequence_number) DO UPDATE SET
          step_name = EXCLUDED.step_name,
          department = EXCLUDED.department,
          status = EXCLUDED.status,
          status_message = EXCLUDED.status_message
      `, [
        step.job_card_id,
        step.sequence_number,
        step.step_name,
        step.department,
        step.requires_qa,
        step.auto_action,
        step.status,
        step.status_message
      ]);
    }

    console.log('✅ Workflow steps inserted successfully!\n');

    // Update job_cards with initial workflow state
    if (workflowSteps.length > 0) {
      const firstStep = workflowSteps[0];
      await pool.query(`
        UPDATE job_cards
        SET 
          current_step = $1,
          current_department = $2,
          workflow_status = $3,
          status_message = $4,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        firstStep.step_name,
        firstStep.department,
        firstStep.status,
        firstStep.status_message,
        jobId
      ]);
      console.log(`✅ Updated job_cards: ${firstStep.step_name} (${firstStep.department})\n`);
    }

    // Check for Offset Printing step
    const offsetStep = workflowSteps.find(step => 
      step.step_name === 'Offset Printing' || step.department === 'Offset Printing'
    );

    if (offsetStep) {
      console.log(`✅ Found Offset Printing step at sequence ${offsetStep.sequence_number}`);
      console.log(`   Step: ${offsetStep.step_name}`);
      console.log(`   Department: ${offsetStep.department}`);
      console.log(`   Status: ${offsetStep.status}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

async function main() {
  const jobId = 181; // JC-1767607103136
  
  try {
    await generateWorkflowFromSelections(jobId);
    console.log('✅ Workflow generation completed!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();



