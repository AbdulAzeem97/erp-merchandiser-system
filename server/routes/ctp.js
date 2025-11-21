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
    
    // Debug: Log plate and machine info for all jobs
    result.rows.forEach((job, index) => {
      console.log(`🔍 CTP: Job ${index + 1} (${job.job_card_number}) plate/machine data:`, {
        required_plate_count: job.required_plate_count,
        ctp_machine_id: job.ctp_machine_id,
        ctp_machine_name: job.ctp_machine_name,
        ctp_machine_code: job.ctp_machine_code,
        ctp_machine_type: job.ctp_machine_type,
        ctp_machine_location: job.ctp_machine_location
      });
    });

    // Ensure all fields are explicitly included in response (even if NULL)
    // Map each job to ensure all fields are present
    const jobsWithAllFields = result.rows.map(job => {
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
        ctp_machine_max_plate_size: job.ctp_machine_max_plate_size !== undefined ? job.ctp_machine_max_plate_size : null
      };
      
      // Debug log for first job
      if (result.rows.indexOf(job) === 0) {
        console.log('🔍 CTP: First job mapped data:', {
          original_required_plate_count: job.required_plate_count,
          mapped_required_plate_count: mappedJob.required_plate_count,
          original_ctp_machine_id: job.ctp_machine_id,
          mapped_ctp_machine_id: mappedJob.ctp_machine_id,
          original_ctp_machine_name: job.ctp_machine_name,
          mapped_ctp_machine_name: mappedJob.ctp_machine_name
        });
      }
      
      return mappedJob;
    });

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

    // Auto-complete CTP workflow step
    try {
      const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
      const workflowService = new UnifiedWorkflowService();
      
      // Get job_card_id from prepress_jobs
      const jobCardResult = await dbAdapter.query(
        'SELECT job_card_id FROM prepress_jobs WHERE id = $1',
        [jobId]
      );
      
      if (jobCardResult.rows.length > 0) {
        const jobCardId = jobCardResult.rows[0].job_card_id;
        await workflowService.autoCompleteStep(jobCardId, 'plate_generated', userId);
        console.log(`✅ CTP workflow step auto-completed for job ${jobCardId}`);
      }
    } catch (workflowError) {
      console.error('⚠️ Error auto-completing workflow step (non-critical):', workflowError);
      // Don't fail plate generation if workflow update fails
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

    console.log(`🖨️ CTP: Generating plate tag for job ${jobId}`);

    // Fetch job details
    const query = `
      SELECT 
        jc."jobNumber" as job_card_number,
        p.name as product_name,
        jc.quantity,
        CONCAT(u."firstName", ' ', u."lastName") as designer_name,
        COALESCE(pj.plate_count, pj.required_plate_count, 0) as plate_count,
        COALESCE(pj.required_plate_count, pj.plate_count, 0) as required_plate_count,
        'Standard' as plate_size,
        p.brand as material,
        pj.status,
        pj.completed_at,
        pj.ctp_machine_id,
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

    const result = await dbAdapter.query(query, [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];
    const tagDate = new Date().toLocaleDateString('en-GB');

    // Generate thermal printer tag content
    const tagContent = `
=====================================
       ERP - PLATE TAG
=====================================
Job ID: ${job.job_card_number}
Product: ${job.product_name}
Quantity: ${job.quantity} units
=====================================
Designer: ${job.designer_name || 'N/A'}
Plates: ${job.plate_count || job.required_plate_count || 0} plates
Size: ${job.plate_size || 'Standard'}
Material: ${job.material || 'N/A'}
=====================================
Machine: ${job.ctp_machine_name || job.ctp_machine_code || 'N/A'}
Machine Type: ${job.ctp_machine_type || 'N/A'}
Location: ${job.ctp_machine_location || 'N/A'}
=====================================
Status: ${job.status.replace('_', ' ')}
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
    res.status(500).json({ error: 'Failed to generate plate tag', message: error.message });
  }
}));

export default router;

