import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import UnifiedWorkflowService from './services/unifiedWorkflowService.js';

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

async function fixJob(jobNumber, userId = 1) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log(`\n🔧 Fixing job: ${jobNumber}\n`);
    console.log('='.repeat(80));
    
    // 1. Find job card
    const jobCardResult = await client.query(`
      SELECT id, "jobNumber", status, current_department
      FROM job_cards
      WHERE "jobNumber" = $1
    `, [jobNumber]);

    if (jobCardResult.rows.length === 0) {
      console.log('❌ Job not found');
      await client.query('ROLLBACK');
      return;
    }

    const jobCard = jobCardResult.rows[0];
    const jobCardId = jobCard.id;
    console.log('✅ Found job card:', { id: jobCardId, status: jobCard.status });

    // 2. Check planning
    const planningResult = await client.query(`
      SELECT id, planning_status, job_card_id
      FROM job_production_planning
      WHERE job_card_id = $1
    `, [jobCardId]);

    if (planningResult.rows.length === 0) {
      console.log('❌ No planning found for this job');
      await client.query('ROLLBACK');
      return;
    }

    const planning = planningResult.rows[0];
    console.log('✅ Found planning:', { id: planning.id, status: planning.planning_status });

    // 3. Update planning status to APPLIED
    if (planning.planning_status !== 'APPLIED') {
      await client.query(`
        UPDATE job_production_planning
        SET 
          planning_status = 'APPLIED',
          planned_at = CURRENT_TIMESTAMP,
          planned_by = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [userId, planning.id]);
      console.log('✅ Planning status updated to APPLIED');
    } else {
      console.log('ℹ️ Planning already APPLIED');
    }

    // 4. Update job card department and status
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Check which columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' 
      AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message', 'status')
    `);
    const existingColumns = columnCheck.rows.map(r => r.column_name);

    if (existingColumns.includes('current_department')) {
      updateFields.push(`current_department = $${paramIndex}`);
      updateValues.push('Cutting');
      paramIndex++;
    }

    if (existingColumns.includes('current_step')) {
      updateFields.push(`current_step = $${paramIndex}`);
      updateValues.push('Job Planning Completed');
      paramIndex++;
    }

    if (existingColumns.includes('workflow_status')) {
      updateFields.push(`workflow_status = $${paramIndex}`);
      updateValues.push('in_progress'); // Valid values: pending, in_progress, submitted, qa_review, approved, rejected, revision_required, completed
      paramIndex++;
    }

    if (existingColumns.includes('status_message')) {
      updateFields.push(`status_message = $${paramIndex}`);
      updateValues.push('Job planning applied, ready for cutting');
      paramIndex++;
    }

    // Don't update status field - it's an enum and we don't know valid values
    // The status will be updated by the workflow system

    if (updateFields.length > 0) {
      updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
      updateValues.push(jobCardId);
      
      await client.query(`
        UPDATE job_cards
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, updateValues);
      console.log('✅ Job card updated:', { updated_columns: existingColumns });
    }

    // 5. Check and create/activate workflow steps (simplified - direct SQL only)
    try {
      // Check if job_workflow_steps table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'job_workflow_steps'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        // Find existing cutting step
        const existingStep = await client.query(`
          SELECT id, sequence_number, status
          FROM job_workflow_steps
          WHERE job_card_id = $1
            AND (department = 'Cutting' OR department = 'Production')
            AND (step_name ILIKE '%cutting%' OR step_name ILIKE '%press%')
          LIMIT 1
        `, [jobCardId]);
        
        if (existingStep.rows.length > 0) {
          const step = existingStep.rows[0];
          await client.query(`
            UPDATE job_workflow_steps
            SET 
              status = 'in_progress',
              status_message = 'Planning applied, ready for cutting',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [step.id]);
          console.log('✅ Updated existing cutting workflow step');
        } else {
          // Get max sequence number
          const maxSeqResult = await client.query(`
            SELECT COALESCE(MAX(sequence_number), 0) as max_seq
            FROM job_workflow_steps
            WHERE job_card_id = $1
          `, [jobCardId]);
          const maxSeq = maxSeqResult.rows[0].max_seq || 0;
          
          // Create cutting step
          await client.query(`
            INSERT INTO job_workflow_steps (
              job_card_id, sequence_number, step_name, department,
              status, status_message, requires_qa, updated_at, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
          `, [
            jobCardId,
            maxSeq + 1,
            'Press Cutting',
            'Cutting',
            'in_progress',
            'Planning applied, ready for cutting',
            false
          ]);
          console.log('✅ Created cutting workflow step');
        }
      } else {
        console.warn('⚠️ job_workflow_steps table does not exist');
      }
    } catch (workflowError) {
      console.warn('⚠️ Could not update workflow steps:', workflowError.message);
      // Don't fail the transaction - the important parts (planning status, department) are already done
    }

    await client.query('COMMIT');
    console.log('\n✅ Job fixed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing job:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get job numbers from command line arguments
const jobNumbers = process.argv.slice(2);

if (jobNumbers.length === 0) {
  console.log('Usage: node fix-stuck-jobs.js <jobNumber1> [jobNumber2] ...');
  console.log('Example: node fix-stuck-jobs.js JC-1763465724943 JC-1762412616387');
  process.exit(1);
}

(async () => {
  for (const jobNumber of jobNumbers) {
    try {
      await fixJob(jobNumber);
    } catch (error) {
      console.error(`Failed to fix ${jobNumber}:`, error.message);
    }
  }
  await pool.end();
})();

