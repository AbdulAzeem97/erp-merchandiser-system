import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'DevPassword123!',
});

async function checkJobStatus(jobNumber) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 Checking status for job: ${jobNumber}\n`);
    console.log('='.repeat(80));
    
    // 1. Find job card
    const jobCardResult = await client.query(`
      SELECT 
        jc.id,
        jc."jobNumber",
        jc.current_department,
        jc.current_step,
        jc.workflow_status,
        jc.status_message,
        jc.status,
        jc."createdAt",
        jc."updatedAt",
        CAST(jc.id AS TEXT) as id_text
      FROM job_cards jc
      WHERE jc."jobNumber" = $1
    `, [jobNumber]);

    if (jobCardResult.rows.length === 0) {
      console.log('❌ Job not found in job_cards table');
      return;
    }

    const jobCard = jobCardResult.rows[0];
    const jobCardId = jobCard.id;
    
    console.log('\n📋 JOB CARD INFORMATION:');
    console.log('  ID:', jobCard.id, `(Type: ${typeof jobCard.id})`);
    console.log('  Job Number:', jobCard.jobNumber);
    console.log('  Current Department:', jobCard.current_department || 'NULL');
    console.log('  Current Step:', jobCard.current_step || 'NULL');
    console.log('  Workflow Status:', jobCard.workflow_status || 'NULL');
    console.log('  Status Message:', jobCard.status_message || 'NULL');
    console.log('  Status:', jobCard.status || 'NULL');
    console.log('  Created:', jobCard.createdAt);
    console.log('  Updated:', jobCard.updatedAt);

    // 2. Check planning status
    const planningResult = await client.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        planning_status,
        final_total_sheets,
        cutting_layout_type,
        grid_pattern,
        blanks_per_sheet,
        created_at,
        updated_at,
        planned_at,
        planned_by
      FROM job_production_planning
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    console.log('\n📊 PLANNING STATUS:');
    if (planningResult.rows.length === 0) {
      console.log('  ❌ No planning found for this job');
    } else {
      const planning = planningResult.rows[0];
      const idsMatch = String(planning.job_card_id) === String(jobCardId);
      console.log('  ✅ Planning found');
      console.log('  Planning ID:', planning.id);
      console.log('  Job Card ID (planning):', planning.job_card_id, `(Type: ${typeof planning.job_card_id})`);
      console.log('  Job Card ID (job_card):', jobCardId, `(Type: ${typeof jobCardId})`);
      console.log('  IDs Match:', idsMatch ? '✅ YES' : '❌ NO');
      console.log('  Planning Status:', planning.planning_status || 'NULL');
      console.log('  Final Total Sheets:', planning.final_total_sheets || 'NULL');
      console.log('  Cutting Layout:', planning.cutting_layout_type || 'NULL');
      console.log('  Grid Pattern:', planning.grid_pattern || 'NULL');
      console.log('  Blanks Per Sheet:', planning.blanks_per_sheet || 'NULL');
      console.log('  Created:', planning.created_at);
      console.log('  Updated:', planning.updated_at);
      console.log('  Planned At:', planning.planned_at || 'NULL');
    }

    // 3. Check cutting assignments
    const assignmentResult = await client.query(`
      SELECT 
        id,
        job_id,
        CAST(job_id AS TEXT) as job_id_text,
        assigned_to,
        assigned_by,
        status,
        comments,
        started_at,
        finished_at,
        created_at,
        updated_at
      FROM cutting_assignments
      WHERE CAST(job_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    console.log('\n✂️ CUTTING ASSIGNMENTS:');
    if (assignmentResult.rows.length === 0) {
      console.log('  ❌ No cutting assignment found');
    } else {
      const assignment = assignmentResult.rows[0];
      const idsMatch = String(assignment.job_id) === String(jobCardId);
      console.log('  ✅ Assignment found');
      console.log('  Assignment ID:', assignment.id);
      console.log('  Job ID (assignment):', assignment.job_id, `(Type: ${typeof assignment.job_id})`);
      console.log('  Job ID (job_card):', jobCardId, `(Type: ${typeof jobCardId})`);
      console.log('  IDs Match:', idsMatch ? '✅ YES' : '❌ NO');
      console.log('  Status:', assignment.status || 'NULL');
      console.log('  Assigned To:', assignment.assigned_to || 'NULL');
      console.log('  Assigned By:', assignment.assigned_by || 'NULL');
    }

    // 4. Check workflow steps
    const workflowResult = await client.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        step_name,
        department,
        status,
        sequence_number,
        status_message,
        created_at,
        updated_at
      FROM job_workflow_steps
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
      ORDER BY sequence_number
    `, [jobCardId]);

    console.log('\n🔄 WORKFLOW STEPS:');
    if (workflowResult.rows.length === 0) {
      console.log('  ❌ No workflow steps found');
    } else {
      console.log(`  ✅ Found ${workflowResult.rows.length} workflow steps:`);
      workflowResult.rows.forEach((step, index) => {
        const idsMatch = String(step.job_card_id) === String(jobCardId);
        console.log(`\n  Step ${index + 1}:`);
        console.log('    Step Name:', step.step_name);
        console.log('    Department:', step.department);
        console.log('    Status:', step.status);
        console.log('    Sequence:', step.sequence_number);
        console.log('    IDs Match:', idsMatch ? '✅ YES' : '❌ NO');
      });
    }

    // 5. Check prepress job
    const prepressResult = await client.query(`
      SELECT 
        id,
        job_card_id,
        CAST(job_card_id AS TEXT) as job_card_id_text,
        status,
        plate_generated,
        plate_generated_at
      FROM prepress_jobs
      WHERE CAST(job_card_id AS TEXT) = CAST($1 AS TEXT)
    `, [jobCardId]);

    console.log('\n🎨 PREPRESS JOB:');
    if (prepressResult.rows.length === 0) {
      console.log('  ❌ No prepress job found');
    } else {
      const prepress = prepressResult.rows[0];
      const idsMatch = String(prepress.job_card_id) === String(jobCardId);
      console.log('  ✅ Prepress job found');
      console.log('  Prepress ID:', prepress.id);
      console.log('  Job Card ID (prepress):', prepress.job_card_id, `(Type: ${typeof prepress.job_card_id})`);
      console.log('  IDs Match:', idsMatch ? '✅ YES' : '❌ NO');
      console.log('  Status:', prepress.status || 'NULL');
      console.log('  Plate Generated:', prepress.plate_generated ? '✅ YES' : '❌ NO');
      console.log('  Plate Generated At:', prepress.plate_generated_at || 'NULL');
    }

    // 6. Test if job would appear in cutting query
    const cuttingQueryTest = await client.query(`
      SELECT DISTINCT
        jc.id,
        jc."jobNumber",
        jc.current_department,
        jpp.planning_status,
        ca.id as assignment_id
      FROM job_cards jc
      LEFT JOIN cutting_assignments ca ON jc.id = ca.job_id
      LEFT JOIN job_production_planning jpp ON CAST(jc.id AS TEXT) = CAST(jpp.job_card_id AS TEXT)
      WHERE jc."jobNumber" = $1
        AND (
          jc.current_department = 'Cutting' 
          OR ca.id IS NOT NULL 
          OR (jpp.planning_status IS NOT NULL AND jpp.planning_status = 'APPLIED')
        )
    `, [jobNumber]);

    console.log('\n🔪 CUTTING DASHBOARD QUERY TEST:');
    if (cuttingQueryTest.rows.length > 0) {
      console.log('  ✅ Job WOULD appear in cutting dashboard');
      console.log('  Match reason:', {
        by_department: cuttingQueryTest.rows[0].current_department === 'Cutting',
        by_assignment: !!cuttingQueryTest.rows[0].assignment_id,
        by_planning: cuttingQueryTest.rows[0].planning_status === 'APPLIED'
      });
    } else {
      console.log('  ❌ Job would NOT appear in cutting dashboard');
      console.log('  Reasons:');
      console.log('    - Current department is not "Cutting":', jobCard.current_department !== 'Cutting');
      console.log('    - No cutting assignment:', assignmentResult.rows.length === 0);
      if (planningResult.rows.length > 0) {
        console.log('    - Planning status is not APPLIED:', planningResult.rows[0].planning_status !== 'APPLIED');
        console.log('      Current planning status:', planningResult.rows[0].planning_status);
      } else {
        console.log('    - No planning found');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Status check complete\n');

  } catch (error) {
    console.error('❌ Error checking job status:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get job number from command line argument
const jobNumber = process.argv[2] || 'JC-1762412616387';

checkJobStatus(jobNumber).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

