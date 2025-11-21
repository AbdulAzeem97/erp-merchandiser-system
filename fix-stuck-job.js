import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function fixStuckJob() {
  const client = await pool.connect();
  try {
    const jobNumber = 'JC-1763134337242';
    
    console.log(`🔍 Checking job: ${jobNumber}`);
    
    // Get job card
    const jobCardResult = await client.query(`
      SELECT id, "jobNumber", current_department, current_step, workflow_status, status_message
      FROM job_cards
      WHERE "jobNumber" = $1
    `, [jobNumber]);
    
    if (jobCardResult.rows.length === 0) {
      console.log('❌ Job not found');
      process.exit(1);
    }
    
    const jobId = jobCardResult.rows[0].id;
    console.log('\n📋 Current Job Card State:');
    console.log(JSON.stringify(jobCardResult.rows[0], null, 2));
    
    // Get workflow steps
    const workflowStepsResult = await client.query(`
      SELECT * FROM job_workflow_steps
      WHERE job_card_id = $1
      ORDER BY sequence_number ASC
    `, [jobId]);
    
    console.log(`\n📋 Workflow Steps (${workflowStepsResult.rows.length}):`);
    workflowStepsResult.rows.forEach(step => {
      console.log(`  ${step.sequence_number}. ${step.step_name} (${step.department}) - Status: ${step.status}`);
    });
    
    // Find CTP step
    const ctpStep = workflowStepsResult.rows.find(s => 
      (s.step_name.toLowerCase().includes('ctp') || s.step_name.toLowerCase().includes('plate')) &&
      s.status === 'completed'
    ) || workflowStepsResult.rows.filter(s => s.department === 'Prepress' && s.status === 'completed').pop();
    
    if (!ctpStep) {
      console.log('\n❌ CTP step not found or not completed');
      console.log('Completed Prepress steps:');
      workflowStepsResult.rows.filter(s => s.department === 'Prepress' && s.status === 'completed').forEach(s => {
        console.log(`  - ${s.step_name} (sequence: ${s.sequence_number})`);
      });
    } else {
      console.log(`\n✅ Found CTP step: ${ctpStep.step_name} (sequence: ${ctpStep.sequence_number})`);
      
      // Find next step
      const nextStep = workflowStepsResult.rows.find(s => s.sequence_number === ctpStep.sequence_number + 1);
      
      if (nextStep) {
        console.log(`\n📋 Next step: ${nextStep.step_name} (${nextStep.department}) - Status: ${nextStep.status}`);
        
        // Check if it's a cutting step
        const isCuttingStep = nextStep.step_name.toLowerCase().includes('cut') ||
                              nextStep.step_name.toLowerCase().includes('cutting') ||
                              nextStep.step_name.toLowerCase().includes('trim') ||
                              nextStep.step_name.toLowerCase().includes('die');
        
        if (isCuttingStep) {
          console.log('\n✅ Next step is a cutting step! Fixing...');
          
          // Fix department if wrong
          if (nextStep.department !== 'Cutting') {
            await client.query(`
              UPDATE job_workflow_steps
              SET department = 'Cutting'
              WHERE job_card_id = $1 AND sequence_number = $2
            `, [jobId, nextStep.sequence_number]);
            console.log(`✅ Fixed department from "${nextStep.department}" to "Cutting"`);
          }
          
          // Create cutting assignment
          await client.query(`
            INSERT INTO cutting_assignments (job_id, assigned_by, status)
            VALUES ($1, 1, 'Pending')
            ON CONFLICT (job_id) DO UPDATE SET status = 'Pending', updated_at = NOW()
          `, [jobId]);
          console.log('✅ Created/updated cutting assignment');
          
          // Update job_cards
          await client.query(`
            UPDATE job_cards
            SET 
              current_step = $1,
              current_department = 'Cutting',
              workflow_status = 'pending',
              status_message = 'Awaiting cutting assignment',
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [nextStep.step_name, jobId]);
          console.log('✅ Updated job_cards with Cutting department');
          
          // Update workflow step to pending
          await client.query(`
            UPDATE job_workflow_steps
            SET 
              status = 'pending',
              status_message = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE job_card_id = $2 AND sequence_number = $3
          `, [
            `Pending in ${nextStep.step_name} (Cutting)`,
            jobId,
            nextStep.sequence_number
          ]);
          console.log('✅ Updated workflow step to pending');
          
          console.log('\n✅ Job successfully transitioned to Cutting department!');
        } else {
          console.log(`\n⚠️ Next step is not cutting: ${nextStep.step_name} (${nextStep.department})`);
        }
      } else {
        console.log('\n❌ No next step found after CTP');
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const verifyResult = await client.query(`
      SELECT 
        jc.id,
        jc."jobNumber",
        jc.current_department,
        jc.current_step,
        jc.workflow_status,
        jc.status_message,
        ca.id as assignment_id,
        ca.status as cutting_status
      FROM job_cards jc
      LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
      WHERE jc.id = $1
    `, [jobId]);
    
    console.log('\n📋 Final State:');
    console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    
    if (verifyResult.rows[0].current_department === 'Cutting' || verifyResult.rows[0].assignment_id) {
      console.log('\n✅ Job should now appear in cutting dashboard!');
    } else {
      console.log('\n⚠️ Job still not configured for cutting. Check the logs above.');
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixStuckJob();

