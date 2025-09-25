import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import dbAdapter from '../database/adapter.js';

const router = express.Router();

// Get assignment history for a job
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`📋 Getting assignment history for job ${jobId}`);
    
    const query = `
      SELECT 
        jl.*,
        jc.jobNumber,
        jc.status as job_status,
        u."firstName" || ' ' || u."lastName" as assigned_to_name,
        ps.name as process_step_name
      FROM job_lifecycles jl
      LEFT JOIN job_cards jc ON jl."jobCardId" = jc.id
      LEFT JOIN users u ON jl."userId" = u.id
      LEFT JOIN process_steps ps ON jl."processStepId" = ps.id
      WHERE jl."jobCardId" = $1
      ORDER BY jl."createdAt" DESC
    `;
    
    const result = await dbAdapter.query(query, [jobId]);
    
    console.log(`📋 Found ${result.rows.length} assignment history records`);
    
    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error getting assignment history:', error);
    res.status(500).json({ error: 'Failed to get assignment history' });
  }
}));

// Create assignment history record
router.post('/', asyncHandler(async (req, res) => {
  try {
    const { 
      job_id, 
      assigned_to, 
      assigned_by, 
      previous_designer, 
      action_type, 
      notes 
    } = req.body;
    
    console.log(`📝 Creating assignment history record for job ${job_id}`);
    
    // Get the first process step for this job
    const processStepQuery = `
      SELECT ps.id FROM process_steps ps
      JOIN process_sequences pseq ON ps.process_sequence_id = pseq.id
      WHERE pseq.product_type = (
        SELECT p.product_type FROM products p 
        WHERE p.id = (SELECT "productId" FROM job_cards WHERE id = $1)
      ) 
      ORDER BY ps.step_order ASC 
      LIMIT 1
    `;
    
    const processStepResult = await dbAdapter.query(processStepQuery, [job_id]);
    
    if (processStepResult.rows.length === 0) {
      return res.status(400).json({ error: 'No process steps found for this job' });
    }
    
    const processStepId = processStepResult.rows[0].id;
    
    const query = `
      INSERT INTO job_lifecycles (
        "jobCardId",
        "processStepId", 
        status,
        "startTime",
        "userId",
        notes,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), NOW())
      ON CONFLICT ("jobCardId", "processStepId") 
      DO UPDATE SET 
        status = $3,
        "userId" = $4,
        notes = $5,
        "updatedAt" = NOW()
      RETURNING *
    `;
    
    const result = await dbAdapter.query(query, [
      job_id,
      processStepId,
      'IN_PROGRESS',
      assigned_to,
      notes || `Job assigned to designer`
    ]);
    
    console.log(`📝 Assignment history record created:`, result.rows[0]);
    
    res.json({
      success: true,
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating assignment history:', error);
    res.status(500).json({ error: 'Failed to create assignment history record' });
  }
}));

// Get assignment history for a designer
router.get('/designer/:designerId', asyncHandler(async (req, res) => {
  try {
    const { designerId } = req.params;
    
    console.log(`👤 Getting assignment history for designer ${designerId}`);
    
    const query = `
      SELECT 
        jl.*,
        jc.jobNumber,
        jc.status as job_status,
        u."firstName" || ' ' || u."lastName" as assigned_to_name,
        ps.name as process_step_name
      FROM job_lifecycles jl
      LEFT JOIN job_cards jc ON jl."jobCardId" = jc.id
      LEFT JOIN users u ON jl."userId" = u.id
      LEFT JOIN process_steps ps ON jl."processStepId" = ps.id
      WHERE jl."userId" = $1
      ORDER BY jl."createdAt" DESC
      LIMIT 50
    `;
    
    const result = await dbAdapter.query(query, [designerId]);
    
    console.log(`👤 Found ${result.rows.length} assignment history records for designer`);
    
    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error getting designer assignment history:', error);
    res.status(500).json({ error: 'Failed to get designer assignment history' });
  }
}));

export default router;
