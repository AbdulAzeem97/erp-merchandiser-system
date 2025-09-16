import express from 'express';
import { body, validationResult, query } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const jobValidation = [
  body('job_card_id').isLength({ min: 3, max: 50 }).trim(),
  body('product_id').isInt({ min: 1 }),
  body('company_id').optional().isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('delivery_date').isISO8601(),
  body('priority').isIn(['LOW', 'MEDIUM', 'NORMAL', 'HIGH', 'URGENT']),
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
];

// Get all jobs with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('Getting jobs...');
    
    // Enhanced query with proper joins to get complete job information
    const jobsQuery = `
      SELECT 
        jc.*,
        p.sku as product_code,
        p.name as product_name,
        p.brand,
        p.gsm,
        p.description as product_description,
        m.name as material_name,
        c.name as company_name
      FROM job_cards jc
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN materials m ON p.material_id = m.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      ORDER BY jc."createdAt" DESC
      LIMIT 20
    `;

    const jobsResult = await dbAdapter.query(jobsQuery);
    const jobs = jobsResult.rows;

    console.log(`Found ${jobs.length} jobs`);

    res.json({
      jobs,
      pagination: {
        page: 1,
        limit: 20,
        total: jobs.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error in jobs endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}));

// Get job by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

    const query = `
      SELECT 
        jc.*,
        p.sku as product_code,
        p.name as product_name,
        p.brand,
        p.gsm,
        p.description as product_description,
        m.name as material_name,
        c.name as company_name
      FROM job_cards jc
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN materials m ON p.material_id = m.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      WHERE jc.id = $1
    `;

  const result = await dbAdapter.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The requested job does not exist'
    });
  }

  res.json({
    job: result.rows[0]
  });
}));

// Create new job
router.post('/', jobValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const {
    job_card_id,
    product_id,
    company_id,
    po_number,
    quantity,
    delivery_date,
    target_date,
    customer_notes,
    special_instructions,
    priority,
    status,
    customer_name,
    customer_email,
    customer_phone,
    customer_address
  } = req.body;

  // Check if job card ID already exists
  const existingJob = await dbAdapter.query(
    'SELECT id FROM job_cards WHERE "jobNumber" = $1',
    [job_card_id]
  );

  if (existingJob.rows.length > 0) {
    return res.status(409).json({
      error: 'Job card ID already exists',
      message: 'A job with this ID already exists'
    });
  }

  // Create job
  const query = `
    INSERT INTO job_cards (
      "jobNumber", "productId", "companyId", "sequenceId", quantity, "dueDate",
      notes, urgency, status, "totalCost", "createdById", "updatedAt", po_number,
      customer_name, customer_email, customer_phone, customer_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;

  // Map priority values to database enum values
  const urgencyMap = {
    'LOW': 'LOW',
    'MEDIUM': 'NORMAL',
    'NORMAL': 'NORMAL', 
    'HIGH': 'HIGH',
    'URGENT': 'URGENT'
  };

  const result = await dbAdapter.query(query, [
    job_card_id,
    product_id,
    company_id || 1, // Default company ID
    1, // Default sequence ID
    quantity,
    delivery_date,
    customer_notes || '',
    urgencyMap[priority] || 'NORMAL',
    status,
    0, // totalCost - default to 0
    req.user?.id || 1,
    new Date(), // updatedAt - current timestamp
    po_number || '', // PO number from user input
    customer_name || '', // Customer name
    customer_email || '', // Customer email
    customer_phone || '', // Customer phone
    customer_address || '' // Customer address
  ]);

  const job = result.rows[0];

  // Create job lifecycle entry
  try {
    if (global.jobLifecycleService) {
      await global.jobLifecycleService.createJobLifecycle(job.id, req.user?.id || null);
    }
  } catch (lifecycleError) {
    console.error('Error creating job lifecycle:', lifecycleError);
    // Don't fail the job creation if lifecycle fails
  }

  // Emit real-time updates via Socket.io
  const io = req.app.get('io');
  if (io) {
    console.log('🔌 Emitting Socket.io events for job creation:', job.job_card_id);
    
    // Notify all connected users about the new job
    io.emit('job_created', {
      jobCardId: job.job_card_id,
      jobId: job.id,
      productId: job.product_id,
      quantity: job.quantity,
      priority: job.priority,
      status: job.status,
      createdBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
      createdAt: new Date().toISOString(),
      message: `New job ${job.job_card_id} has been created`
    });

    // Notify HOD and ADMIN users specifically
    io.emit('new_job_for_assignment', {
      jobCardId: job.job_card_id,
      jobId: job.id,
      priority: job.priority,
      status: job.status,
      createdAt: new Date().toISOString(),
      message: `New job ${job.job_card_id} is ready for assignment`
    });

    // Notify role-specific rooms
    io.to('role:HOD_PREPRESS').emit('new_job_for_assignment', {
      jobCardId: job.job_card_id,
      jobId: job.id,
      priority: job.priority,
      status: job.status,
      createdAt: new Date().toISOString(),
      message: `New job ${job.job_card_id} is ready for assignment`
    });

    io.to('role:ADMIN').emit('new_job_for_assignment', {
      jobCardId: job.job_card_id,
      jobId: job.id,
      priority: job.priority,
      status: job.status,
      createdAt: new Date().toISOString(),
      message: `New job ${job.job_card_id} is ready for assignment`
    });
    
    console.log('✅ Socket.io events emitted successfully for job creation');
  } else {
    console.log('❌ Socket.io instance not found for job creation');
  }

  res.status(201).json({
    message: 'Job created successfully',
    job
  });
}));

// Update job
router.put('/:id', jobValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const {
    job_card_id,
    product_id,
    company_id,
    po_number,
    quantity,
    delivery_date,
    target_date,
    customer_notes,
    special_instructions,
    priority,
    status,
    progress
  } = req.body;

  // Check if job exists
  const existingJob = await dbAdapter.query(
    'SELECT id FROM job_cards WHERE id = $1',
    [id]
  );

  if (existingJob.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The requested job does not exist'
    });
  }

  // Check if new job card ID conflicts with existing jobs
  const idConflict = await dbAdapter.query(
    'SELECT id FROM job_cards WHERE "jobNumber" = $1 AND id != $2',
    [job_card_id, id]
  );

  if (idConflict.rows.length > 0) {
    return res.status(409).json({
      error: 'Job card ID already exists',
      message: 'A job with this ID already exists'
    });
  }

  // Map priority values to database enum values
  const urgencyMap = {
    'LOW': 'LOW',
    'MEDIUM': 'NORMAL',
    'NORMAL': 'NORMAL', 
    'HIGH': 'HIGH',
    'URGENT': 'URGENT'
  };

  // Update job
  const query = `
    UPDATE job_cards SET
      "jobNumber" = $1,
      "productId" = $2,
      "companyId" = $3,
      quantity = $5,
      "dueDate" = $6,
      notes = $8,
      urgency = $10,
      status = $11,
      "updatedAt" = $12
    WHERE id = $13
    RETURNING *
  `;

  const result = await dbAdapter.query(query, [
    job_card_id,
    product_id,
    company_id,
    quantity,
    delivery_date,
    customer_notes,
    urgencyMap[priority] || 'NORMAL',
    status,
    new Date(), // updatedAt
    id
  ]);

  const job = result.rows[0];

  res.json({
    message: 'Job updated successfully',
    job
  });
}));

// Delete job
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if job exists
  const existingJob = await dbAdapter.query(
    'SELECT id FROM job_cards WHERE id = $1',
    [id]
  );

  if (existingJob.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The requested job does not exist'
    });
  }

  // Delete job (cascade will handle related records)
  await dbAdapter.query('DELETE FROM job_cards WHERE id = $1', [id]);

  res.json({
    message: 'Job deleted successfully'
  });
}));

// Generate job PDF
router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get job details with product and company information
  const query = `
    SELECT 
      jc.*,
      p.name as product_name,
      p.sku as product_code,
      p.brand,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc."productId" = p.id
    LEFT JOIN companies c ON jc."companyId" = c.id
    WHERE jc.id = $1
  `;

  const result = await dbAdapter.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }

  const job = result.rows[0];

  // Generate PDF content (simplified version)
  const pdfContent = `
    <html>
      <head>
        <title>Job Card - ${job.jobNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .job-info { margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .label { font-weight: bold; }
          .value { margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JOB CARD</h1>
          <h2>${job.jobNumber}</h2>
        </div>
        
        <div class="job-info">
          <div class="section">
            <span class="label">Job Number:</span>
            <span class="value">${job.jobNumber}</span>
          </div>
          <div class="section">
            <span class="label">Product:</span>
            <span class="value">${job.product_name || 'N/A'} (${job.product_code || 'N/A'})</span>
          </div>
          <div class="section">
            <span class="label">Brand:</span>
            <span class="value">${job.brand || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Company:</span>
            <span class="value">${job.company_name || 'N/A'}</span>
          </div>
          <div class="section">
            <span class="label">Quantity:</span>
            <span class="value">${job.quantity}</span>
          </div>
          <div class="section">
            <span class="label">Due Date:</span>
            <span class="value">${new Date(job.dueDate).toLocaleDateString()}</span>
          </div>
          <div class="section">
            <span class="label">Status:</span>
            <span class="value">${job.status}</span>
          </div>
          <div class="section">
            <span class="label">Priority:</span>
            <span class="value">${job.urgency}</span>
          </div>
          <div class="section">
            <span class="label">Notes:</span>
            <span class="value">${job.notes || 'None'}</span>
          </div>
        </div>
      </body>
    </html>
  `;

  // Set headers for PDF download
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="job-${job.jobNumber}.html"`);
  
  res.send(pdfContent);
}));

// Get job statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_jobs,
      COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_jobs,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_jobs
    FROM job_cards
  `;

  const statsResult = await dbAdapter.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent jobs
  const recentQuery = `
    SELECT 
      jc.*,
      p.sku as product_code,
      p.brand,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc."productId" = p.id
    LEFT JOIN companies c ON jc."companyId" = c.id
    ORDER BY jc."createdAt" DESC
    LIMIT 5
  `;

  const recentResult = await dbAdapter.query(recentQuery);
  const recent = recentResult.rows;

  res.json({
    stats,
    recent
  });
}));

export default router;


