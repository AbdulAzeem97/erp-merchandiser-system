import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Helper function for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all CTP jobs (QA approved jobs pending for plate generation)
router.get('/jobs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    console.log('🖨️ CTP: Fetching jobs for plate generation');
    console.log('🖨️ CTP: User making request:', req.user);

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
        COALESCE(pj.plate_count, 0) as plate_count,
        p.brand as material,
        pj.ctp_notes,
        pj.status,
        COALESCE(pj.plate_generated, false) as plate_generated,
        pj.plate_generated_at,
        pj.created_at,
        pj.completed_at
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u_designer ON pj.assigned_designer_id = u_designer.id
      WHERE pj.status = 'APPROVED_BY_QA'
         OR pj.plate_generated = true
      ORDER BY 
        pj.plate_generated ASC,
        pj.created_at DESC
    `;

    const result = await dbAdapter.query(query);

    console.log(`✅ CTP: Found ${result.rows.length} jobs`);
    console.log('✅ CTP: Job statuses:', result.rows.map(j => j.status).join(', '));

    res.json({
      success: true,
      jobs: result.rows
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
        COALESCE(pj.plate_count, 0) as plate_count,
        'Standard' as plate_size,
        p.brand as material,
        pj.status,
        pj.completed_at
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN users u ON pj.assigned_designer_id = u.id
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
Plates: ${job.plate_count || 0} plates
Size: ${job.plate_size || 'Standard'}
Material: ${job.material || 'N/A'}
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

