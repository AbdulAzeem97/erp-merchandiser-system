import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Helper function for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Debug endpoint to check specific job data
router.get('/jobs/debug/:jobNumber', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobNumber } = req.params;
    console.log(`🔍 CTP Debug: Checking job ${jobNumber}`);
    
    const query = `
      SELECT 
        pj.id as prepress_job_id,
        pj.job_card_id,
        jc."jobNumber" as job_card_number,
        pj.required_plate_count,
        pj.ctp_machine_id,
        pj.status as prepress_status,
        jc.status as job_card_status,
        cm.machine_code,
        cm.machine_name,
        cm.machine_type,
        cm.location
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
      WHERE jc."jobNumber" = $1
    `;
    
    const result = await dbAdapter.query(query, [jobNumber]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Job not found',
        jobNumber
      });
    }
    
    res.json({
      success: true,
      job: result.rows[0],
      debug: {
        has_required_plate_count: result.rows[0].required_plate_count !== null,
        has_ctp_machine_id: result.rows[0].ctp_machine_id !== null,
        has_machine_details: result.rows[0].machine_name !== null
      }
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ error: 'Failed to debug job', message: error.message });
  }
}));

// Get all CTP jobs (QA approved jobs pending for plate generation)
router.get('/jobs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    console.log('🖨️ CTP: Fetching jobs for plate generation');
    console.log('🖨️ CTP: User making request:', req.user);

    // Query to fetch CTP jobs with all plate and machine information
    // This matches the structure used by the QA dashboard to ensure consistency
    const query = `
      SELECT 
        pj.id,
        pj.job_card_id,
        jc."jobNumber" as job_card_number,
        p.name as product_name,
        p.sku as product_item_code,
        jc.customer_name,
        c.name as company_name,
        jc.quantity,
        CONCAT(u_designer."firstName", ' ', u_designer."lastName") as designer_name,
        jc.final_design_link as final_pdf_link,
        'Standard' as plate_size,
        COALESCE(pj.plate_count, pj.required_plate_count, 0) as plate_count,
        pj.required_plate_count,
        p.brand as material,
        pj.ctp_notes,
        pj.status,
        COALESCE(pj.plate_generated, false) as plate_generated,
        pj.plate_generated_at,
        pj.created_at,
        pj.completed_at,
        pj.ctp_machine_id,
        pj.blank_width_mm,
        pj.blank_height_mm,
        pj.blank_width_inches,
        pj.blank_height_inches,
        pj.blank_size_unit,
        cm.machine_code as ctp_machine_code,
        cm.machine_name as ctp_machine_name,
        cm.machine_type as ctp_machine_type,
        cm.manufacturer as ctp_machine_manufacturer,
        cm.model as ctp_machine_model,
        cm.location as ctp_machine_location,
        cm.max_plate_size as ctp_machine_max_plate_size
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u_designer ON pj.assigned_designer_id = u_designer.id
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
      WHERE pj.status = 'APPROVED_BY_QA'
         OR pj.plate_generated = true
      ORDER BY 
        pj.plate_generated ASC,
        pj.created_at DESC
    `;

    const result = await dbAdapter.query(query);

    console.log(`✅ CTP: Found ${result.rows.length} jobs`);
    console.log('✅ CTP: Job statuses:', result.rows.map(j => j.status).join(', '));
    
    // Enhance jobs with multiple machines
    const jobsWithAllFields = await Promise.all(result.rows.map(async (job) => {
      // Fetch multiple machines from job_ctp_machines
      let machines = [];
      try {
        const machinesResult = await dbAdapter.query(`
          SELECT 
            jcm.*,
            cm.machine_code,
            cm.machine_name,
            cm.machine_type,
            cm.manufacturer,
            cm.model,
            cm.location,
            cm.max_plate_size
          FROM job_ctp_machines jcm
          JOIN ctp_machines cm ON jcm.ctp_machine_id = cm.id
          WHERE jcm.prepress_job_id = $1
          ORDER BY jcm.created_at
        `, [job.id]);
        
        machines = machinesResult.rows.map(m => ({
          id: m.ctp_machine_id,
          machine_code: m.machine_code,
          machine_name: m.machine_name,
          machine_type: m.machine_type,
          manufacturer: m.manufacturer,
          model: m.model,
          location: m.location,
          max_plate_size: m.max_plate_size,
          plate_count: m.plate_count
        }));
      } catch (error) {
        console.error(`Error fetching machines for CTP job ${job.id}:`, error);
      }

      // If no machines found in job_ctp_machines, use single machine from prepress_jobs (backward compatibility)
      if (machines.length === 0 && job.ctp_machine_id) {
        machines = [{
          id: job.ctp_machine_id,
          machine_code: job.ctp_machine_code,
          machine_name: job.ctp_machine_name,
          machine_type: job.ctp_machine_type,
          manufacturer: job.ctp_machine_manufacturer,
          model: job.ctp_machine_model,
          location: job.ctp_machine_location,
          max_plate_size: job.ctp_machine_max_plate_size,
          plate_count: job.required_plate_count || 0
        }];
      }

      const mappedJob = {
        ...job,
        // Explicitly set all plate/machine fields, converting undefined to null
        required_plate_count: job.required_plate_count !== undefined ? job.required_plate_count : null,
        plate_count: job.plate_count !== undefined ? job.plate_count : (job.required_plate_count || 0),
        ctp_machine_id: job.ctp_machine_id !== undefined ? job.ctp_machine_id : null,
        ctp_machine_code: job.ctp_machine_code !== undefined ? job.ctp_machine_code : null,
        ctp_machine_name: job.ctp_machine_name !== undefined ? job.ctp_machine_name : null,
        ctp_machine_type: job.ctp_machine_type !== undefined ? job.ctp_machine_type : null,
        ctp_machine_manufacturer: job.ctp_machine_manufacturer !== undefined ? job.ctp_machine_manufacturer : null,
        ctp_machine_model: job.ctp_machine_model !== undefined ? job.ctp_machine_model : null,
        ctp_machine_location: job.ctp_machine_location !== undefined ? job.ctp_machine_location : null,
        ctp_machine_max_plate_size: job.ctp_machine_max_plate_size !== undefined ? job.ctp_machine_max_plate_size : null,
        // Multiple machines array
        machines: machines,
        // Blank size information
        blank_width_mm: job.blank_width_mm || null,
        blank_height_mm: job.blank_height_mm || null,
        blank_width_inches: job.blank_width_inches || null,
        blank_height_inches: job.blank_height_inches || null,
        blank_size_unit: job.blank_size_unit || 'mm'
      };
      
      return mappedJob;
    }));

    res.json({
      success: true,
      jobs: jobsWithAllFields
    });

  } catch (error) {
    console.error('❌ Error fetching CTP jobs:', error);
    res.status(500).json({ error: 'Failed to fetch CTP jobs', message: error.message });
  }
}));

// Generate plate for a job
router.post('/jobs/:jobId/generate-plate', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const { plate_count, notes } = req.body;
    const userId = req.user.id;

    console.log(`🖨️ CTP: Generating plate for job ${jobId}`);

    // Update prepress job with plate generation info
    const updateQuery = `
      UPDATE prepress_jobs
      SET 
        plate_generated = true,
        plate_generated_at = NOW(),
        plate_generated_by = $1,
        plate_count = $2,
        ctp_notes = $3,
        status = 'COMPLETED',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await dbAdapter.query(updateQuery, [userId, plate_count, notes, jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get job_card_id from prepress_jobs
    const jobCardResult = await dbAdapter.query(
      'SELECT job_card_id FROM prepress_jobs WHERE id = $1',
      [jobId]
    );
    
    if (jobCardResult.rows.length > 0) {
      const jobCardId = jobCardResult.rows[0].job_card_id;
      
      // Update job_cards to transition to Job Planning department
      try {
        const columnCheck = await dbAdapter.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'job_cards' 
          AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message')
        `);
        const existingColumns = columnCheck.rows.map(r => r.column_name);
        
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (existingColumns.includes('current_department')) {
          updateFields.push(`current_department = $${paramIndex}`);
          updateValues.push('Job Planning');
          paramIndex++;
        }
        
        if (existingColumns.includes('current_step')) {
          updateFields.push(`current_step = $${paramIndex}`);
          updateValues.push('Job Planning');
          paramIndex++;
        }
        
        if (existingColumns.includes('workflow_status')) {
          updateFields.push(`workflow_status = $${paramIndex}`);
          updateValues.push('pending');
          paramIndex++;
        }
        
        if (existingColumns.includes('status_message')) {
          updateFields.push(`status_message = $${paramIndex}`);
          updateValues.push('CTP completed, ready for job planning');
          paramIndex++;
        }
        
        if (existingColumns.includes('updatedAt') || existingColumns.includes('updated_at')) {
          const updatedAtColumn = existingColumns.includes('updatedAt') ? 'updatedAt' : 'updated_at';
          updateFields.push(`"${updatedAtColumn}" = CURRENT_TIMESTAMP`);
        }
        
        if (updateFields.length > 0) {
          updateValues.push(jobCardId);
          const jobCardUpdateQuery = `
            UPDATE job_cards SET
              ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id${existingColumns.includes('current_department') ? ', current_department' : ''}${existingColumns.includes('current_step') ? ', current_step' : ''}${existingColumns.includes('workflow_status') ? ', workflow_status' : ''}
          `;
          const jobCardUpdateResult = await dbAdapter.query(jobCardUpdateQuery, updateValues);
          console.log('✅ Job card updated to Job Planning department:', {
            job_card_id: jobCardId,
            current_department: jobCardUpdateResult.rows[0]?.current_department,
            current_step: jobCardUpdateResult.rows[0]?.current_step,
            workflow_status: jobCardUpdateResult.rows[0]?.workflow_status
          });
        }
      } catch (jobCardUpdateError) {
        console.error('❌ Error updating job card:', jobCardUpdateError);
        console.warn('⚠️ Continuing despite job card update error');
      }
      
      // Auto-complete CTP workflow step and activate Job Planning step
      try {
        const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
        const workflowService = new UnifiedWorkflowService();
        
        await workflowService.autoCompleteStep(jobCardId, 'plate_generated', userId);
        console.log(`✅ CTP workflow step auto-completed for job ${jobCardId}`);
        
        // Activate Job Planning workflow step
        const workflowSteps = await workflowService.getJobWorkflow(jobCardId);
        const jobPlanningStep = workflowSteps.find(step => 
          (step.department === 'Job Planning' || step.department === 'Production') &&
          (step.step_name.toLowerCase().includes('planning') || step.step_name.toLowerCase().includes('job planning'))
        );
        
        if (jobPlanningStep) {
          if (jobPlanningStep.status === 'inactive' || jobPlanningStep.status === 'pending') {
            await workflowService.startStep(jobCardId, jobPlanningStep.sequence_number, userId);
            console.log(`✅ Job Planning workflow step activated: ${jobPlanningStep.step_name}`);
          } else {
            console.log(`ℹ️ Job Planning workflow step already active: ${jobPlanningStep.step_name} (${jobPlanningStep.status})`);
          }
        } else {
          console.log('⚠️ No Job Planning workflow step found to activate');
        }
      } catch (workflowError) {
        console.error('⚠️ Error updating workflow steps (non-critical):', workflowError);
        // Don't fail plate generation if workflow update fails
      }
    }

    // TODO: Deduct plates from inventory (consumables)
    // This would integrate with inventory management system

    console.log(`✅ Plate generated for job ${jobId}`);

    res.json({
      success: true,
      message: 'Plate generated successfully',
      job: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error generating plate:', error);
    res.status(500).json({ error: 'Failed to generate plate', message: error.message });
  }
}));

// Generate and print plate tag
router.post('/jobs/:jobId/print-tag', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobIdNum = parseInt(jobId, 10);

    if (isNaN(jobIdNum)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    console.log(`🖨️ CTP: Generating plate tag for job ${jobIdNum}`);

    // Check if blank size columns exist in prepress_jobs table
    let hasBlankSizeColumns = false;
    try {
      const columnCheck = await dbAdapter.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'prepress_jobs' 
        AND column_name IN ('blank_width_mm', 'blank_height_mm', 'blank_width_inches', 'blank_height_inches', 'blank_size_unit')
      `);
      hasBlankSizeColumns = columnCheck.rows.length > 0;
      console.log(`🔍 Blank size columns exist: ${hasBlankSizeColumns}`);
    } catch (error) {
      console.warn('⚠️ Could not check for blank size columns:', error);
    }

    // Build query with conditional blank size columns
    const blankSizeColumns = hasBlankSizeColumns ? `
        pj.blank_width_mm,
        pj.blank_height_mm,
        pj.blank_width_inches,
        pj.blank_height_inches,
        pj.blank_size_unit,` : `
        NULL::DECIMAL as blank_width_mm,
        NULL::DECIMAL as blank_height_mm,
        NULL::DECIMAL as blank_width_inches,
        NULL::DECIMAL as blank_height_inches,
        NULL::VARCHAR as blank_size_unit,`;

    // Fetch job details
    const query = `
      SELECT 
        jc."jobNumber" as job_card_number,
        p.name as product_name,
        jc.quantity,
        COALESCE(
          CASE 
            WHEN u."firstName" IS NOT NULL AND u."lastName" IS NOT NULL 
            THEN u."firstName" || ' ' || u."lastName"
            WHEN u."firstName" IS NOT NULL THEN u."firstName"
            WHEN u."lastName" IS NOT NULL THEN u."lastName"
            ELSE 'N/A'
          END,
          'N/A'
        ) as designer_name,
        COALESCE(pj.plate_count, pj.required_plate_count, 0) as plate_count,
        COALESCE(pj.required_plate_count, pj.plate_count, 0) as required_plate_count,
        'Standard' as plate_size,
        p.brand as material,
        pj.status,
        pj.completed_at,
        pj.ctp_machine_id,${blankSizeColumns}
        cm.machine_code as ctp_machine_code,
        cm.machine_name as ctp_machine_name,
        cm.machine_type as ctp_machine_type,
        cm.manufacturer as ctp_machine_manufacturer,
        cm.model as ctp_machine_model,
        cm.location as ctp_machine_location,
        cm.max_plate_size as ctp_machine_max_plate_size
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN users u ON pj.assigned_designer_id = u.id
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
      WHERE pj.id = $1
    `;

    console.log(`🔍 Executing query for job ${jobIdNum}`);
    let result;
    try {
      result = await dbAdapter.query(query, [jobIdNum]);
      console.log(`✅ Query successful, found ${result.rows.length} rows`);
    } catch (queryError) {
      console.error('❌ SQL Query Error:', queryError);
      console.error('❌ Query:', query);
      console.error('❌ Parameters:', [jobIdNum]);
      throw queryError;
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Fetch all machines from job_ctp_machines
    let machines = [];
    try {
      const machinesResult = await dbAdapter.query(`
        SELECT 
          jcm.*,
          cm.machine_code,
          cm.machine_name,
          cm.machine_type,
          cm.manufacturer,
          cm.model,
          cm.location,
          cm.max_plate_size
        FROM job_ctp_machines jcm
        JOIN ctp_machines cm ON jcm.ctp_machine_id = cm.id
        WHERE jcm.prepress_job_id = $1
        ORDER BY jcm.created_at
      `, [jobIdNum]);
      
      machines = machinesResult.rows;
    } catch (error) {
      console.error('Error fetching machines for print tag:', error);
    }

    // If no machines found in job_ctp_machines, use single machine from prepress_jobs (backward compatibility)
    if (machines.length === 0 && job.ctp_machine_id) {
      machines = [{
        machine_name: job.ctp_machine_name || job.ctp_machine_code || 'N/A',
        machine_type: job.ctp_machine_type || 'N/A',
        location: job.ctp_machine_location || 'N/A',
        plate_count: job.required_plate_count || job.plate_count || 0
      }];
    }

    const tagDate = new Date().toLocaleDateString('en-GB');
    const totalPlates = machines.reduce((sum, m) => {
      const plateCount = typeof m.plate_count === 'number' ? m.plate_count : (parseInt(m.plate_count) || 0);
      return sum + plateCount;
    }, 0);

    // Format blank size
    let blankSizeText = 'N/A';
    if (job.blank_width_mm && job.blank_height_mm) {
      try {
        // Convert to numbers to ensure .toFixed() works
        const widthMm = typeof job.blank_width_mm === 'number' ? job.blank_width_mm : parseFloat(job.blank_width_mm);
        const heightMm = typeof job.blank_height_mm === 'number' ? job.blank_height_mm : parseFloat(job.blank_height_mm);
        const widthInches = job.blank_width_inches ? (typeof job.blank_width_inches === 'number' ? job.blank_width_inches : parseFloat(job.blank_width_inches)) : null;
        const heightInches = job.blank_height_inches ? (typeof job.blank_height_inches === 'number' ? job.blank_height_inches : parseFloat(job.blank_height_inches)) : null;
        
        // Validate that we have valid numbers
        if (!isNaN(widthMm) && !isNaN(heightMm) && widthMm > 0 && heightMm > 0) {
          if (job.blank_size_unit === 'inches' && widthInches && heightInches && !isNaN(widthInches) && !isNaN(heightInches)) {
            blankSizeText = `${widthInches.toFixed(2)}" × ${heightInches.toFixed(2)}" (${widthMm.toFixed(2)}mm × ${heightMm.toFixed(2)}mm)`;
          } else {
            const displayWidthInches = widthInches && !isNaN(widthInches) ? widthInches.toFixed(2) : (widthMm / 25.4).toFixed(2);
            const displayHeightInches = heightInches && !isNaN(heightInches) ? heightInches.toFixed(2) : (heightMm / 25.4).toFixed(2);
            blankSizeText = `${widthMm.toFixed(2)}mm × ${heightMm.toFixed(2)}mm (${displayWidthInches}" × ${displayHeightInches}")`;
          }
        }
      } catch (error) {
        console.error('Error formatting blank size:', error);
        blankSizeText = 'N/A';
      }
    }

    // Generate thermal printer tag content with all machines
    let machinesSection = '';
    if (machines.length > 0) {
      machinesSection = machines.map((m, index) => {
        const plateCount = typeof m.plate_count === 'number' ? m.plate_count : (parseInt(m.plate_count) || 0);
        return `
Machine ${index + 1}: ${m.machine_name || m.machine_code || 'N/A'}
  Type: ${m.machine_type || 'N/A'}
  Location: ${m.location || 'N/A'}
  Plates: ${plateCount} plates`;
      }).join('\n');
    } else {
      machinesSection = 'Machine: N/A\n  Plates: 0 plates';
    }

    const tagContent = `
=====================================
       ERP - PLATE TAG
=====================================
Job ID: ${job.job_card_number}
Product: ${job.product_name}
Quantity: ${job.quantity} units
=====================================
Designer: ${job.designer_name || 'N/A'}
Total Plates: ${totalPlates} plates
Blank Size: ${blankSizeText}
Size: ${job.plate_size || 'Standard'}
Material: ${job.material || 'N/A'}
=====================================
${machinesSection}
=====================================
Status: ${job.status ? job.status.replace('_', ' ') : 'N/A'}
Date: ${tagDate}
=====================================
    `.trim();

    console.log(`✅ Plate tag generated for job ${job.job_card_number}`);

    res.json({
      success: true,
      tagContent: tagContent,
      job: job
    });

  } catch (error) {
    console.error('❌ Error generating plate tag:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Failed to generate plate tag', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name,
        code: error.code
      } : undefined
    });
  }
}));

export default router;

