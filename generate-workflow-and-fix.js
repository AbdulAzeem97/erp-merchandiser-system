import { Pool } from 'pg';
import UnifiedWorkflowService from './server/services/unifiedWorkflowService.js';
import dbAdapter from './server/database/adapter.js';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function generateAndFix() {
  const client = await pool.connect();
  try {
    await dbAdapter.initialize();
    console.log('✅ Database adapter initialized\n');
    
    const jobNumber = 'JC-1763134337242';
    
    // Get job
    const jobResult = await client.query(`
      SELECT id, "productId", "jobNumber"
      FROM job_cards
      WHERE "jobNumber" = $1
    `, [jobNumber]);
    
    if (jobResult.rows.length === 0) {
      console.log('❌ Job not found');
      process.exit(1);
    }
    
    const jobId = jobResult.rows[0].id;
    const productId = jobResult.rows[0].productId;
    
    console.log(`📋 Job: ${jobNumber}`);
    console.log(`  ID: ${jobId}`);
    console.log(`  Product ID: ${productId}\n`);
    
    if (!productId) {
      console.log('❌ Job has no product assigned');
      process.exit(1);
    }
    
    // Check if workflow already exists
    const existingSteps = await client.query(`
      SELECT COUNT(*) as count FROM job_workflow_steps WHERE job_card_id = $1
    `, [jobId]);
    
    if (parseInt(existingSteps.rows[0].count) > 0) {
      console.log('⚠️ Workflow steps already exist. Regenerating...');
      await client.query(`DELETE FROM job_workflow_steps WHERE job_card_id = $1`, [jobId]);
    }
    
    // Generate workflow
    console.log('🔄 Generating workflow from product process sequence...');
    const workflowService = new UnifiedWorkflowService();
    const workflowSteps = await workflowService.generateWorkflowFromProduct(jobId, productId);
    
    console.log(`✅ Generated ${workflowSteps.length} workflow steps\n`);
    
    // Display workflow
    const stepsResult = await client.query(`
      SELECT sequence_number, step_name, department, status
      FROM job_workflow_steps
      WHERE job_card_id = $1
      ORDER BY sequence_number
    `, [jobId]);
    
    console.log('📋 Generated Workflow Steps:');
    stepsResult.rows.forEach(s => {
      console.log(`  ${s.sequence_number}. ${s.step_name} (${s.department}) - ${s.status}`);
    });
    
    // Find cutting step
    const cuttingStep = stepsResult.rows.find(s => 
      s.step_name.toLowerCase().includes('cut') || 
      s.step_name.toLowerCase().includes('cutting') ||
      s.step_name.toLowerCase().includes('trim') ||
      s.step_name.toLowerCase().includes('die')
    );
    
    if (!cuttingStep) {
      console.log('\n⚠️ No cutting step found in generated workflow');
      console.log('This might be expected if the product process sequence does not include cutting.');
      process.exit(0);
    }
    
    console.log(`\n✅ Found cutting step: ${cuttingStep.step_name} (sequence: ${cuttingStep.sequence_number})`);
    
    // Find CTP step and mark it as completed
    const ctpStep = stepsResult.rows.find(s => 
      (s.step_name.toLowerCase().includes('ctp') || s.step_name.toLowerCase().includes('plate')) &&
      s.department === 'Prepress'
    );
    
    if (ctpStep) {
      console.log(`\n✅ Found CTP step: ${ctpStep.step_name} (sequence: ${ctpStep.sequence_number})`);
      console.log('  Marking CTP as completed...');
      
      await client.query(`
        UPDATE job_workflow_steps
        SET 
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $1 AND sequence_number = $2
      `, [jobId, ctpStep.sequence_number]);
      
      // Mark all previous steps as completed
      await client.query(`
        UPDATE job_workflow_steps
        SET 
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE job_card_id = $1 AND sequence_number < $2
      `, [jobId, cuttingStep.sequence_number]);
      
      console.log('  ✅ CTP and previous steps marked as completed');
    }
    
    // Fix cutting step department if needed
    if (cuttingStep.department !== 'Cutting') {
      console.log(`\n⚠️ Fixing department from "${cuttingStep.department}" to "Cutting"`);
      await client.query(`
        UPDATE job_workflow_steps
        SET department = 'Cutting'
        WHERE job_card_id = $1 AND sequence_number = $2
      `, [jobId, cuttingStep.sequence_number]);
    }
    
    // Create cutting assignment
    console.log('\n🔧 Creating cutting assignment...');
    await client.query(`
      INSERT INTO cutting_assignments (job_id, assigned_by, status)
      VALUES ($1, 1, 'Pending')
      ON CONFLICT (job_id) DO UPDATE SET status = 'Pending', updated_at = NOW()
    `, [jobId]);
    console.log('  ✅ Cutting assignment created');
    
    // Update job_cards
    console.log('🔧 Updating job_cards...');
    await client.query(`
      UPDATE job_cards
      SET 
        current_department = 'Cutting',
        current_step = $1,
        workflow_status = 'pending',
        status_message = 'Awaiting cutting assignment',
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [cuttingStep.step_name, jobId]);
    console.log('  ✅ Job cards updated');
    
    // Update cutting step to pending
    await client.query(`
      UPDATE job_workflow_steps
      SET 
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE job_card_id = $1 AND sequence_number = $2
    `, [jobId, cuttingStep.sequence_number]);
    console.log('  ✅ Cutting step set to pending');
    
    // Verify
    console.log('\n🔍 Verifying...');
    const verifyResult = await client.query(`
      SELECT 
        jc.current_department,
        jc.current_step,
        ca.id as assignment_id,
        ca.status as cutting_status
      FROM job_cards jc
      LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
      WHERE jc.id = $1
    `, [jobId]);
    
    const verified = verifyResult.rows[0];
    console.log(`\n✅ Final state:`);
    console.log(`  Department: ${verified.current_department}`);
    console.log(`  Step: ${verified.current_step}`);
    console.log(`  Assignment ID: ${verified.assignment_id || 'NULL'}`);
    console.log(`  Cutting Status: ${verified.cutting_status || 'NULL'}`);
    
    if (verified.current_department === 'Cutting' || verified.assignment_id) {
      console.log('\n✅ Job should now appear in cutting dashboard!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    await dbAdapter.close();
  }
}

generateAndFix();

