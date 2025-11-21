import express from 'express';
import { body, validationResult, query } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requirePermission, authenticateToken } from '../middleware/rbac.js';

const router = express.Router();

// Validation middleware
const jobValidation = [
  body('job_card_id').isLength({ min: 3, max: 50 }).trim(),
  body('product_id').isInt({ min: 1 }),
  body('company_id').optional().isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('delivery_date').isISO8601(),
  body('priority').isIn(['LOW', 'MEDIUM', 'NORMAL', 'HIGH', 'URGENT']),
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  body('client_layout_link').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '' || value === undefined) return true;
    return /^https?:\/\/.+/.test(value);
  }),
];

// Get all jobs with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('Getting jobs...');
    console.log('Query params:', req.query);
    
    // Check if workflow columns exist
    const columnCheck = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' 
      AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message')
    `);
    const existingColumns = columnCheck.rows.map(r => r.column_name);
    const hasWorkflowColumns = existingColumns.length > 0;
    
    console.log('Workflow columns exist:', hasWorkflowColumns, existingColumns);
    
    // Build WHERE clause based on query parameters
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    if (req.query.status) {
      whereConditions.push(`jc.status = $${paramIndex}`);
      queryParams.push(req.query.status);
      paramIndex++;
    }
    
    if (req.query.search) {
      whereConditions.push(`(jc."jobNumber" ILIKE $${paramIndex} OR jc.customer_name ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`);
      queryParams.push(`%${req.query.search}%`);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build workflow columns part conditionally
    const workflowColumns = hasWorkflowColumns 
      ? `jc.current_department,
         jc.current_step,
         jc.workflow_status,
         jc.status_message`
      : `NULL as current_department,
         NULL as current_step,
         NULL as workflow_status,
         NULL as status_message`;
    
    // Enhanced query with proper joins to get complete job information including workflow data
  const jobsQuery = `
    SELECT 
      jc.*,
        p.sku as product_code,
        p.name as product_name,
      p.brand,
        p.gsm,
        p.description as product_description,
        p."fscCertified" as fsc,
        p."fscLicense" as fsc_claim,
        m.name as material_name,
        cat.name as category_name,
      c.name as company_name,
        jc.customer_name,
        jc.customer_email,
        jc.customer_phone,
        jc.customer_address,
        u."firstName" || ' ' || u."lastName" as assigned_designer_name,
        u.email as assigned_designer_email,
        u.phone as assigned_designer_phone,
        pj.required_plate_count,
        pj.ctp_machine_id,
        cm.machine_code as ctp_machine_code,
        cm.machine_name as ctp_machine_name,
        cm.machine_type as ctp_machine_type,
        cm.manufacturer as ctp_machine_manufacturer,
        cm.model as ctp_machine_model,
        cm.location as ctp_machine_location,
        cm.max_plate_size as ctp_machine_max_plate_size,
        ${workflowColumns}
    FROM job_cards jc
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN materials m ON p.material_id = m.id
      LEFT JOIN categories cat ON p."categoryId" = cat.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u ON jc."assignedToId" = u.id
      LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
    ${whereClause}
      ORDER BY jc."createdAt" DESC
      LIMIT 20
  `;

    const jobsResult = await dbAdapter.query(jobsQuery, queryParams);
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Add ratio report to a job
router.post('/:jobId/ratio-report', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`💾 Creating ratio report for job ID: ${jobId}`);
    const {
      excel_file_link,
      excel_file_name,
      factory_name,
      po_number,
      job_number,
      brand_name,
      item_name,
      report_date,
      total_ups,
      total_sheets,
      total_plates,
      qty_produced,
      excess_qty,
      efficiency_percentage,
      excess_percentage,
      required_order_qty,
      color_details,
      plate_distribution,
      color_efficiency,
      raw_excel_data
    } = req.body;

    // Verify job exists
    const jobCheck = await dbAdapter.query('SELECT id FROM job_cards WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Insert ratio report
    const result = await dbAdapter.query(`
      INSERT INTO ratio_reports (
        job_card_id, excel_file_link, excel_file_name, factory_name, po_number,
        job_number, brand_name, item_name, report_date, total_ups, total_sheets,
        total_plates, qty_produced, excess_qty, efficiency_percentage, excess_percentage,
        required_order_qty, color_details, plate_distribution, color_efficiency,
        raw_excel_data, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `, [
      jobId, excel_file_link, excel_file_name, factory_name, po_number,
      job_number, brand_name, item_name, report_date, total_ups, total_sheets,
      total_plates, qty_produced, excess_qty, efficiency_percentage, excess_percentage,
      required_order_qty, JSON.stringify(color_details), JSON.stringify(plate_distribution),
      JSON.stringify(color_efficiency), JSON.stringify(raw_excel_data), req.user.id
    ]);

    console.log(`✅ Ratio report created successfully for job ${jobId}`);
    
    res.status(201).json({
      success: true,
      message: 'Ratio report added successfully',
      ratioReport: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding ratio report:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}));

// Get ratio report for a job
router.get('/:jobId/ratio-report', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`🔍 Looking for ratio report for job ID: ${jobId}`);
    console.log(`🔍 User making request:`, req.user);
    console.log(`🔍 Database adapter initialized:`, dbAdapter.initialized);

    console.log(`🔍 About to query ratio_reports table...`);
    const result = await dbAdapter.query(`
      SELECT * FROM ratio_reports 
      WHERE job_card_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [jobId]);
    console.log(`🔍 Database query completed successfully`);

    console.log(`📊 Found ${result.rows.length} ratio reports for job ${jobId}`);
    
    if (result.rows.length > 0) {
      console.log(`📊 Ratio report data types:`, {
        total_ups: typeof result.rows[0].total_ups,
        total_ups_value: result.rows[0].total_ups,
        total_sheets: typeof result.rows[0].total_sheets,
        color_details: typeof result.rows[0].color_details,
        color_details_sample: result.rows[0].color_details
      });
    }

    if (result.rows.length === 0) {
      // Let's also check if there are any ratio reports at all
      const allReports = await dbAdapter.query('SELECT job_card_id, job_number, brand_name FROM ratio_reports LIMIT 5');
      console.log('📝 Available ratio reports:', allReports.rows);
      
      // Also check if the job exists in job_cards
      const jobExists = await dbAdapter.query('SELECT id, "jobNumber" FROM job_cards WHERE id = $1', [jobId]);
      console.log(`🔍 Job ${jobId} exists in job_cards:`, jobExists.rows.length > 0);
      if (jobExists.rows.length > 0) {
        console.log('Job details:', jobExists.rows[0]);
      }
      
      return res.status(404).json({ error: 'No ratio report found for this job' });
    }

    const ratioReport = result.rows[0];
    
    // Parse JSON fields if they are strings, otherwise keep as objects
    if (ratioReport.color_details && typeof ratioReport.color_details === 'string') {
      ratioReport.color_details = JSON.parse(ratioReport.color_details);
    }
    if (ratioReport.plate_distribution && typeof ratioReport.plate_distribution === 'string') {
      ratioReport.plate_distribution = JSON.parse(ratioReport.plate_distribution);
    }
    if (ratioReport.color_efficiency && typeof ratioReport.color_efficiency === 'string') {
      ratioReport.color_efficiency = JSON.parse(ratioReport.color_efficiency);
    }
    if (ratioReport.raw_excel_data && typeof ratioReport.raw_excel_data === 'string') {
      ratioReport.raw_excel_data = JSON.parse(ratioReport.raw_excel_data);
    }

    // Transform plate_distribution from complex format to simple count format
    // Complex format: {A: {colors: [...], sheets: 50, totalUPS: 18}, ...}
    // Simple format: {A: 3, B: 3, C: 2, D: 1} (number of colors per plate)
    if (ratioReport.plate_distribution && typeof ratioReport.plate_distribution === 'object') {
      const simplePlateDistribution = {};
      Object.entries(ratioReport.plate_distribution).forEach(([plate, data]) => {
        if (data && typeof data === 'object' && data.colors) {
          // Complex format - count the colors array
          simplePlateDistribution[plate] = data.colors.length;
        } else if (typeof data === 'number') {
          // Already simple format
          simplePlateDistribution[plate] = data;
        }
      });
      ratioReport.plate_distribution_simple = simplePlateDistribution;
    }

    res.json({
      success: true,
      ratioReport
    });

  } catch (error) {
    console.error('Error fetching ratio report:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
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
      c.name as company_name,
        jc.customer_name,
        jc.customer_email,
        jc.customer_phone,
        jc.customer_address
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
    console.log('Validation errors:', errors.array());
    console.log('Request body keys:', Object.keys(req.body));
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
    customer_address,
    assigned_designer_id,
    client_layout_link
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
      customer_name, customer_email, customer_phone, customer_address, "assignedToId", client_layout_link
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
    customer_address || '', // Customer address
    assigned_designer_id || null, // Assigned designer ID
    client_layout_link || '' // Client layout Google Drive link
  ]);

  const job = result.rows[0];

  // Automatically create prepress job entry (mandatory for all jobs)
  try {
    const PrepressService = (await import('../services/prepressService.js')).default;
    const prepressService = new PrepressService();
    
    await prepressService.createPrepressJob(
      job.id,
      assigned_designer_id || null,
      priority || 'MEDIUM',
      delivery_date ? new Date(delivery_date) : null,
      req.user?.id || 1
    );
    console.log(`✅ Prepress job created automatically for job ${job.id}`);
  } catch (prepressError) {
    // If prepress job already exists, that's okay
    if (prepressError.message && prepressError.message.includes('already exists')) {
      console.log('ℹ️ Prepress job already exists for this job');
    } else {
      console.error('⚠️ Error creating prepress job (non-critical):', prepressError);
      // Don't fail job creation if prepress job creation fails
    }
  }

  // Copy product process sequence selections to job
  try {
    // Get product's process sequence selections
    const productSelections = await dbAdapter.query(
      `SELECT "stepId", is_selected 
       FROM product_step_selections 
       WHERE "productId" = $1 AND is_selected = true`,
      [product_id]
    );

    // Copy selections to job_process_selections
    if (productSelections.rows.length > 0) {
      for (const selection of productSelections.rows) {
        await dbAdapter.query(
          `INSERT INTO job_process_selections ("jobId", "processStepId", is_selected, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT ("jobId", "processStepId") DO NOTHING`,
          [job.id, selection.stepId, selection.is_selected]
        );
      }
      console.log(`✅ Copied ${productSelections.rows.length} process sequence selections from product to job ${job.id}`);
    }
  } catch (selectionError) {
    console.error('⚠️ Error copying product process selections (non-critical):', selectionError);
    // Don't fail job creation if copying selections fails
  }

  // Generate workflow steps from product process sequence
  try {
    const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
    const workflowService = new UnifiedWorkflowService();
    
    // Set socket handler if available
    const io = req.app.get('io');
    if (io) {
      workflowService.setSocketHandler(io);
    }
    
    await workflowService.generateWorkflowFromProduct(job.id, product_id);
    console.log(`✅ Workflow generated for job ${job.id}`);
  } catch (workflowError) {
    console.error('⚠️ Error generating workflow (non-critical):', workflowError);
    // Don't fail job creation if workflow generation fails
  }

  // Create job lifecycle entry (backward compatibility)
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

// Get job attachments
router.get('/:id/attachments', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        ja.*,
        u."firstName" || ' ' || u."lastName" as uploaded_by_name
      FROM job_attachments ja
      LEFT JOIN users u ON ja.uploaded_by = u.id
      WHERE ja.job_card_id = $1
      ORDER BY ja.created_at DESC
    `;
    
    const result = await dbAdapter.query(query, [id]);
    const attachments = result.rows;
    
    res.json({
      success: true,
      attachments: attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.file_name,
        filePath: attachment.file_path,
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        uploadedBy: attachment.uploaded_by_name,
        uploadedAt: attachment.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching job attachments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job attachments',
      message: error.message
    });
  }
}));

// Job assignment endpoint for HOD Prepress
router.post('/job-assignment/assign', 
  authenticateToken,
  requirePermission('ASSIGN_PREPRESS_JOBS'),
  asyncHandler(async (req, res) => {
  try {
    const { jobCardId, assignedDesignerId, isReassignment = false, priority = 'MEDIUM', dueDate, notes } = req.body;
    
    console.log('🔄 Job assignment request:', { jobCardId, assignedDesignerId, isReassignment, priority, dueDate, notes });
    console.log('🔐 User info:', req.user);
    console.log('🔐 User role:', req.user?.role);
    
    // Verify job exists
    const jobResult = await dbAdapter.query(
      'SELECT id, "jobNumber", "assignedToId" FROM job_cards WHERE id = $1',
      [jobCardId]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const job = jobResult.rows[0];
    const previousDesignerId = job.assignedToId;
    
    // Update job assignment
    const updateQuery = `
      UPDATE job_cards 
      SET "assignedToId" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await dbAdapter.query(updateQuery, [assignedDesignerId, jobCardId]);
    const updatedJob = updateResult.rows[0];
    
    // Create or update prepress job
    let prepressJob;
    try {
      // Check if prepress job already exists
      const existingPrepressResult = await dbAdapter.query(
        'SELECT id FROM prepress_jobs WHERE job_card_id = $1',
        [jobCardId]
      );
      
      if (existingPrepressResult.rows.length > 0) {
        // Update existing prepress job
        const updatePrepressQuery = `
          UPDATE prepress_jobs 
          SET assigned_designer_id = $1, status = 'ASSIGNED', updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $3
          RETURNING *
        `;
        const updatePrepressResult = await dbAdapter.query(updatePrepressQuery, [assignedDesignerId, req.user?.id || 1, jobCardId]);
        prepressJob = updatePrepressResult.rows[0];
      } else {
        // Create new prepress job
        const createPrepressQuery = `
          INSERT INTO prepress_jobs (job_card_id, assigned_designer_id, status, priority, due_date, created_by, updated_by)
          VALUES ($1, $2, 'ASSIGNED', $3, $4, $5, $6)
          RETURNING *
        `;
        const createPrepressResult = await dbAdapter.query(createPrepressQuery, [
          jobCardId, assignedDesignerId, priority, dueDate, req.user?.id || 1, req.user?.id || 1
        ]);
        prepressJob = createPrepressResult.rows[0];
      }
      
      // Log activity
      const activityQuery = `
        INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const action = isReassignment ? 'REASSIGNED' : 'ASSIGNED';
      const remark = notes || (isReassignment ? `Reassigned to designer ${assignedDesignerId}` : `Assigned to designer ${assignedDesignerId}`);
      
      await dbAdapter.query(activityQuery, [
        prepressJob.id, 
        req.user?.id || 1, 
        action, 
        isReassignment ? 'ASSIGNED' : null, 
        'ASSIGNED', 
        remark
      ]);
      
    } catch (prepressError) {
      console.log('⚠️ Prepress job handling failed, but job assignment succeeded:', prepressError);
    }
    
    console.log('✅ Job assignment successful:', {
      jobId: jobCardId,
      jobNumber: job.jobNumber,
      previousDesigner: previousDesignerId,
      newDesigner: assignedDesignerId,
      isReassignment
    });
    
    res.json({
      success: true,
      message: isReassignment ? 'Job reassigned successfully' : 'Job assigned successfully',
      data: {
        jobId: jobCardId,
        jobNumber: job.jobNumber,
        assignedDesignerId,
        previousDesignerId,
        isReassignment
      }
    });
    
  } catch (error) {
    console.error('❌ Job assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign job'
    });
  }
}));

// Get jobs assigned to a specific designer
router.get('/assigned-to/:designerId', asyncHandler(async (req, res) => {
  try {
    const { designerId } = req.params;
    
    const query = `
      SELECT 
        jc.*,
        c.name as company_name,
        u."firstName" || ' ' || u."lastName" as created_by_name,
        d."firstName" || ' ' || d."lastName" as assigned_designer_name,
        d.email as assigned_designer_email,
        d.phone as assigned_designer_phone,
        pj.required_plate_count,
        pj.ctp_machine_id,
        cm.machine_code as ctp_machine_code,
        cm.machine_name as ctp_machine_name,
        cm.machine_type as ctp_machine_type,
        cm.manufacturer as ctp_machine_manufacturer,
        cm.model as ctp_machine_model,
        cm.location as ctp_machine_location,
        cm.max_plate_size as ctp_machine_max_plate_size
      FROM job_cards jc
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u ON jc."createdById" = u.id
      LEFT JOIN users d ON jc."assignedToId" = d.id
      LEFT JOIN prepress_jobs pj ON jc.id = pj.job_card_id
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
      WHERE jc."assignedToId" = $1
      ORDER BY jc."createdAt" DESC
    `;
    
    const result = await dbAdapter.query(query, [designerId]);
    const jobs = result.rows;
    
    // Enhance jobs with complete product data
    const enhancedJobs = await Promise.all(jobs.map(async (job) => {
      let productData = {
        productCode: 'N/A',
        productName: 'N/A',
        brand: 'N/A',
        gsm: 0,
        fsc: 'N/A',
        fscClaim: 'N/A',
        materialName: 'N/A',
        categoryName: 'N/A',
        colorSpecifications: '',
        remarks: ''
      };
      
      // Fetch complete product data if productId exists
      if (job.productId) {
        try {
          const productResult = await dbAdapter.query(`
            SELECT 
              p.id, p.name, p.sku, p.brand, p.gsm, p."fscCertified", p."fscLicense",
              p.color_specifications, p.remarks,
              m.name as material_name,
              c.name as category_name
            FROM products p
            LEFT JOIN materials m ON p.material_id = m.id
            LEFT JOIN categories c ON p."categoryId" = c.id
            WHERE p.id = $1
          `, [job.productId]);
          
          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            productData = {
              productCode: product.sku || 'N/A',
              productName: product.name || product.sku || 'N/A',
              brand: product.brand || 'N/A',
              gsm: product.gsm || 0,
              fsc: product.fscCertified ? 'Yes' : 'No',
              fscClaim: product.fscLicense || 'N/A',
              materialName: product.material_name || 'N/A',
              categoryName: product.category_name || 'N/A',
              colorSpecifications: product.color_specifications || '',
              remarks: product.remarks || ''
            };
          }
        } catch (error) {
          console.error(`Error fetching product data for job ${job.id}:`, error);
        }
      }
      
      return {
        id: job.id,
        jobNumber: job.jobNumber,
        productCode: productData.productCode,
        productName: productData.productName,
        brand: productData.brand,
        gsm: productData.gsm,
        description: job.description || '',
        productType: 'Offset', // Default product type
        colorSpecifications: productData.colorSpecifications || '',
        remarks: productData.remarks || '',
        fsc: productData.fsc,
        fscClaim: productData.fscClaim,
        materialName: productData.materialName,
        categoryName: productData.categoryName,
        companyName: job.company_name || 'N/A',
        customerName: job.customer_name || 'N/A',
        customerEmail: job.customer_email || 'N/A',
        customerPhone: job.customer_phone || 'N/A',
        customerAddress: job.customer_address || 'N/A',
        poNumber: job.po_number || 'N/A',
        quantity: job.quantity || 0,
        dueDate: job.dueDate,
        status: job.status || 'PENDING',
        urgency: job.urgency || 'NORMAL',
        notes: job.notes || '',
        createdBy: job.created_by_name || 'N/A',
        assignedDesigner: job.assigned_designer_name || 'N/A',
        assignedDesignerEmail: job.assigned_designer_email || 'N/A',
        assignedDesignerPhone: job.assigned_designer_phone || 'N/A',
        clientLayoutLink: job.client_layout_link || '',
        finalDesignLink: job.final_design_link || '',
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        required_plate_count: job.required_plate_count || null,
        ctp_machine_id: job.ctp_machine_id || null,
        ctp_machine_code: job.ctp_machine_code || null,
        ctp_machine_name: job.ctp_machine_name || null,
        ctp_machine_type: job.ctp_machine_type || null,
        ctp_machine_manufacturer: job.ctp_machine_manufacturer || null,
        ctp_machine_model: job.ctp_machine_model || null,
        ctp_machine_location: job.ctp_machine_location || null,
        ctp_machine_max_plate_size: job.ctp_machine_max_plate_size || null
      };
    }));
    
    res.json({
      success: true,
      jobs: enhancedJobs
    });
  } catch (error) {
    console.error('Error fetching jobs assigned to designer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assigned jobs' });
  }
}));

// Assign job to designer
router.put('/:id/assign', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_designer_id, notes } = req.body;

    console.log(`🔧 Assigning job ${id} to designer ${assigned_designer_id}`);
    console.log(`🔧 Request body:`, req.body);
    console.log(`🔧 User info:`, req.user);

    const query = `
      UPDATE job_cards 
      SET 
        "assignedToId" = $1,
        status = 'IN_PROGRESS',
        "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `;

    console.log(`🔧 Executing query: ${query}`);
    console.log(`🔧 Parameters: [${assigned_designer_id}, ${id}]`);
    
    const result = await dbAdapter.query(query, [assigned_designer_id, id]);
    console.log(`🔧 Query result:`, result.rows);
    
    if (result.rows.length === 0) {
      console.log(`❌ Job ${id} not found`);
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Record assignment history in job_lifecycles table
    try {
      console.log('📝 Recording job assignment history...');
      
        // Get the first process step for this job (using default 'Offset' product type)
        const processStepQuery = `
          SELECT ps.id FROM process_steps ps
          JOIN process_sequences pseq ON ps.process_sequence_id = pseq.id
          WHERE pseq.product_type = 'Offset'
          ORDER BY ps.step_order ASC 
          LIMIT 1
        `;
        
        const processStepResult = await dbAdapter.query(processStepQuery);
        
        if (processStepResult.rows.length > 0) {
          const processStepId = processStepResult.rows[0].id;
        
        // Insert assignment record in job_lifecycles
        const lifecycleQuery = `
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
        
        const lifecycleResult = await dbAdapter.query(lifecycleQuery, [
          job.id,
          processStepId,
          'IN_PROGRESS',
          assigned_designer_id,
          notes || `Job assigned to designer by ${req.user?.firstName || 'System'}`
        ]);
        
        console.log('📝 Job assignment history recorded:', lifecycleResult.rows[0]);
      }
    } catch (historyError) {
      console.error('⚠️ Failed to record assignment history:', historyError);
      // Don't fail the assignment if history recording fails
    }

    // Emit real-time updates via Socket.io
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting Socket.io events for job assignment:', job.jobNumber);
      
      // Get the socket handler instance
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        // Use the enhanced notification system
        const assignedByName = req.user?.firstName + ' ' + req.user?.lastName || 'System';
        socketHandler.emitJobAssignment(job, assigned_designer_id, assignedByName);
      } else {
        // Fallback to basic notifications
        io.emit('job_assigned', {
          jobId: job.id,
          jobCardId: job.jobNumber,
          designerId: assigned_designer_id,
          assignedBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
          createdAt: new Date().toISOString(),
          message: `Job ${job.jobNumber} has been assigned to a designer`
        });

        // Notify the assigned designer specifically
        io.to(`user:${assigned_designer_id}`).emit('job_assigned', {
          jobId: job.id,
          jobCardId: job.jobNumber,
          designerId: assigned_designer_id,
          assignedBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
          createdAt: new Date().toISOString(),
          message: `You have been assigned job ${job.jobNumber}`
        });
      }
      
      console.log('✅ Socket.io events emitted successfully for job assignment');
    }

    res.json({ 
      success: true, 
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        assignedDesignerId: job.assignedToId,
        status: job.status
      }
    });
  } catch (error) {
    console.error('❌ Error assigning job:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to assign job', details: error.message });
  }
}));

// Update job status
router.put('/:id/status', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log(`Updating job ${id} status to ${status}`);

    const query = `
      UPDATE job_cards 
      SET 
        status = $1,
        "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await dbAdapter.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Emit real-time updates via Socket.io
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting Socket.io events for job status update:', job.jobNumber);
      
      // Get the socket handler instance
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        // Use the enhanced notification system
        const updatedBy = req.user?.firstName + ' ' + req.user?.lastName || 'System';
        // Note: We don't have old status here, but we can emit the update
        socketHandler.emitJobStatusUpdate(job, 'UNKNOWN', job.status, updatedBy);
      } else {
        // Fallback to basic notifications
        io.emit('job_status_update', {
          jobId: job.id,
          jobCardId: job.jobNumber,
          status: job.status,
          updatedBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
          createdAt: new Date().toISOString(),
          message: `Job ${job.jobNumber} status updated to ${job.status}`
        });
      }
      
      console.log('✅ Socket.io events emitted successfully for job status update');
    }

    res.json({ 
      success: true, 
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
}));

// QA Approve Job
router.post('/:id/qa-approve', 
  authenticateToken,
  requirePermission('APPROVE_QA_JOBS'),
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { qaNotes } = req.body;
      
      console.log('✅ QA Approving job:', id);
      
      // Update job status to APPROVED_BY_QA
      const updateQuery = `
        UPDATE job_cards 
        SET status = 'APPROVED_BY_QA', 
            qa_notes = $1,
            qa_approved_by = $2,
            qa_approved_at = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await dbAdapter.query(updateQuery, [
        qaNotes || '',
        req.user?.id || 1,
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      // Update workflow step using UnifiedWorkflowService
      try {
        const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
        const workflowService = new UnifiedWorkflowService();
        
        // Set socket handler if available
        const io = req.app.get('io');
        if (io) {
          workflowService.setSocketHandler(io);
        }
        
        // Find current workflow step that needs QA approval
        const workflowSteps = await workflowService.getJobWorkflow(id);
        const currentStep = workflowSteps.find(step => 
          ['submitted', 'qa_review'].includes(step.status) && step.requires_qa
        );
        
        if (currentStep) {
          await workflowService.approveStep(id, currentStep.sequence_number, req.user?.id || 1, qaNotes || '');
          console.log(`✅ Workflow step ${currentStep.sequence_number} approved via unified workflow`);
        } else {
          console.log('⚠️ No workflow step found for QA approval, using legacy update');
        }
      } catch (workflowError) {
        console.error('⚠️ Workflow approval failed, falling back to legacy update:', workflowError);
      }
      
      // Update prepress job status if exists (backward compatibility)
      // IMPORTANT: Only update status, preserve all other fields (required_plate_count, ctp_machine_id, etc.)
      try {
        // First, verify prepress job exists and log current plate/machine data
        const prepressCheck = await dbAdapter.query(`
          SELECT id, required_plate_count, ctp_machine_id, status
          FROM prepress_jobs 
          WHERE job_card_id = $1
        `, [id]);
        
        if (prepressCheck.rows.length > 0) {
          const prepressJob = prepressCheck.rows[0];
          console.log('🔍 QA Approval - Prepress job data before update:', {
            prepress_job_id: prepressJob.id,
            required_plate_count: prepressJob.required_plate_count,
            ctp_machine_id: prepressJob.ctp_machine_id,
            current_status: prepressJob.status
          });
          
          // Update ONLY the status, preserving all other fields
          await dbAdapter.query(`
            UPDATE prepress_jobs 
            SET status = 'APPROVED_BY_QA', updated_at = CURRENT_TIMESTAMP
            WHERE job_card_id = $1
          `, [id]);
          
          // Verify data is preserved after update
          const verifyQuery = await dbAdapter.query(`
            SELECT id, required_plate_count, ctp_machine_id, status
            FROM prepress_jobs 
            WHERE job_card_id = $1
          `, [id]);
          
          if (verifyQuery.rows.length > 0) {
            const verified = verifyQuery.rows[0];
            console.log('✅ QA Approval - Prepress job data after update (preserved):', {
              prepress_job_id: verified.id,
              required_plate_count: verified.required_plate_count,
              ctp_machine_id: verified.ctp_machine_id,
              new_status: verified.status
            });
          }
        }
        
        // Log QA activity
        await dbAdapter.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          SELECT pj.id, $1, 'APPROVED_BY_QA', 'SUBMITTED_TO_QA', 'APPROVED_BY_QA', $2
          FROM prepress_jobs pj WHERE pj.job_card_id = $3
        `, [req.user?.id || 1, qaNotes || 'Approved by QA', id]);
      } catch (prepressError) {
        console.log('⚠️ Prepress update failed, but job approval succeeded:', prepressError);
      }
      
      console.log('✅ Job approved by QA successfully');
      
      res.json({
        success: true,
        message: 'Job approved by QA',
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ QA approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve job'
      });
    }
  })
);

// QA Reject Job
router.post('/:id/qa-reject', 
  authenticateToken,
  requirePermission('REJECT_QA_JOBS'),
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { qaNotes } = req.body;
      
      console.log('❌ QA Rejecting job:', id);
      
      // Update job status to REVISIONS_REQUIRED
      const updateQuery = `
        UPDATE job_cards 
        SET status = 'REVISIONS_REQUIRED', 
            qa_notes = $1,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await dbAdapter.query(updateQuery, [
        qaNotes || '',
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      // Update workflow step using UnifiedWorkflowService
      try {
        const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
        const workflowService = new UnifiedWorkflowService();
        
        // Set socket handler if available
        const io = req.app.get('io');
        if (io) {
          workflowService.setSocketHandler(io);
        }
        
        // Find current workflow step that needs QA rejection
        const workflowSteps = await workflowService.getJobWorkflow(id);
        const currentStep = workflowSteps.find(step => 
          ['submitted', 'qa_review'].includes(step.status) && step.requires_qa
        );
        
        if (currentStep) {
          await workflowService.rejectStep(id, currentStep.sequence_number, req.user?.id || 1, qaNotes || '');
          console.log(`✅ Workflow step ${currentStep.sequence_number} rejected via unified workflow`);
        } else {
          console.log('⚠️ No workflow step found for QA rejection, using legacy update');
        }
      } catch (workflowError) {
        console.error('⚠️ Workflow rejection failed, falling back to legacy update:', workflowError);
      }
      
      // Update prepress job status if exists (backward compatibility)
      try {
        await dbAdapter.query(`
          UPDATE prepress_jobs 
          SET status = 'REVISIONS_REQUIRED', updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $1
        `, [id]);
        
        // Log QA activity
        await dbAdapter.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          SELECT pj.id, $1, 'REVISIONS_REQUIRED', 'SUBMITTED_TO_QA', 'REVISIONS_REQUIRED', $2
          FROM prepress_jobs pj WHERE pj.job_card_id = $3
        `, [req.user?.id || 1, qaNotes || 'Revisions required by QA', id]);
      } catch (prepressError) {
        console.log('⚠️ Prepress update failed, but job rejection succeeded:', prepressError);
      }
      
      console.log('✅ Job rejected by QA successfully');
      
      res.json({
        success: true,
        message: 'Job returned for revisions',
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ QA rejection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject job'
      });
    }
  })
);

// Submit to QA
router.post('/:id/submit-to-qa', 
  authenticateToken,
  requirePermission('SUBMIT_TO_QA'),
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { finalDesignLink, status } = req.body;
      
      console.log('🎨 Designer submitting job to QA:', id);
      
      // Update job with final design link and status
      const updateQuery = `
        UPDATE job_cards 
        SET final_design_link = $1,
            status = $2,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await dbAdapter.query(updateQuery, [
        finalDesignLink || '',
        status || 'SUBMITTED_TO_QA',
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
      
      // Update workflow step using UnifiedWorkflowService
      try {
        const UnifiedWorkflowService = (await import('../services/unifiedWorkflowService.js')).default;
        const workflowService = new UnifiedWorkflowService();
        
        // Set socket handler if available
        const io = req.app.get('io');
        if (io) {
          workflowService.setSocketHandler(io);
        }
        
        // Find current workflow step that needs to be submitted
        const workflowSteps = await workflowService.getJobWorkflow(id);
        const currentStep = workflowSteps.find(step => 
          step.status === 'in_progress' && step.requires_qa
        );
        
        if (currentStep) {
          await workflowService.submitToQA(id, currentStep.sequence_number, req.user?.id || 1);
          console.log(`✅ Workflow step ${currentStep.sequence_number} submitted to QA via unified workflow`);
        } else {
          console.log('⚠️ No workflow step found for submission, using legacy update');
        }
      } catch (workflowError) {
        console.error('⚠️ Workflow submission failed, falling back to legacy update:', workflowError);
      }
      
      // Update prepress job status if exists (backward compatibility)
      try {
        await dbAdapter.query(`
          UPDATE prepress_jobs 
          SET status = 'SUBMITTED_TO_QA', updated_at = CURRENT_TIMESTAMP
          WHERE job_card_id = $1
        `, [id]);
        
        // Log activity
        await dbAdapter.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          SELECT pj.id, $1, 'SUBMITTED_TO_QA', 'IN_PROGRESS', 'SUBMITTED_TO_QA', 'Submitted to QA for review'
          FROM prepress_jobs pj WHERE pj.job_card_id = $2
        `, [req.user?.id || 1, id]);
      } catch (prepressError) {
        console.log('⚠️ Prepress update failed, but job submission succeeded:', prepressError);
      }
      
      console.log('✅ Job submitted to QA successfully');
      
      res.json({
        success: true,
        message: 'Job submitted to QA',
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Submit to QA error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit job to QA',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  })
);

// Get CTP machines list
router.get('/ctp/machines', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        machine_code,
        machine_name,
        machine_type,
        manufacturer,
        model,
        status,
        location,
        description,
        max_plate_size,
        is_active
      FROM ctp_machines
      WHERE is_active = true
      ORDER BY machine_code ASC
    `;

    const result = await dbAdapter.query(query);
    
    res.json({
      success: true,
      machines: result.rows
    });
  } catch (error) {
    console.error('Error fetching CTP machines:', error);
    res.status(500).json({ 
      error: 'Failed to fetch CTP machines', 
      message: error.message 
    });
  }
}));

// Update plate count and machine for a job
router.put('/:id/plate-info', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { required_plate_count, ctp_machine_id, machines } = req.body;
    const userId = req.user?.id;

    console.log(`Updating plate info for job ${id}:`, { required_plate_count, ctp_machine_id, machines });

    // Validate plate count
    if (required_plate_count !== undefined && required_plate_count !== null) {
      if (!Number.isInteger(required_plate_count) || required_plate_count < 0) {
        return res.status(400).json({
          error: 'Invalid plate count',
          message: 'Plate count must be a non-negative integer'
        });
      }
    }

    // Validate machine ID if provided
    if (ctp_machine_id) {
      const machineCheck = await dbAdapter.query(
        'SELECT id FROM ctp_machines WHERE id = $1 AND is_active = true',
        [ctp_machine_id]
      );
      
      if (machineCheck.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid machine',
          message: 'The specified CTP machine does not exist or is not active'
        });
      }
    }

    // Check if prepress job exists
    const prepressJobCheck = await dbAdapter.query(
      'SELECT id, job_card_id FROM prepress_jobs WHERE job_card_id = $1',
      [id]
    );

    if (prepressJobCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Prepress job not found',
        message: 'No prepress job found for this job card'
      });
    }

    const prepressJobId = prepressJobCheck.rows[0].id;

    // Handle multiple machines if provided
    if (machines && Array.isArray(machines) && machines.length > 0) {
      // Validate all machines exist
      const machineIds = machines.map(m => m.ctp_machine_id);
      const machineCheck = await dbAdapter.query(
        `SELECT id FROM ctp_machines WHERE id = ANY($1::int[]) AND is_active = true`,
        [machineIds]
      );
      
      if (machineCheck.rows.length !== machineIds.length) {
        return res.status(400).json({
          error: 'Invalid machine(s)',
          message: 'One or more specified CTP machines do not exist or are not active'
        });
      }

      // Validate plate counts
      for (const machine of machines) {
        if (!Number.isInteger(machine.plate_count) || machine.plate_count < 0) {
          return res.status(400).json({
            error: 'Invalid plate count',
            message: `Plate count for machine ${machine.ctp_machine_id} must be a non-negative integer`
          });
        }
      }

      // Delete existing machine associations
      await dbAdapter.query(
        'DELETE FROM job_ctp_machines WHERE prepress_job_id = $1',
        [prepressJobId]
      );

      // Insert new machine associations
      const totalPlateCount = machines.reduce((sum, m) => sum + m.plate_count, 0);
      for (const machine of machines) {
        await dbAdapter.query(
          `INSERT INTO job_ctp_machines (prepress_job_id, ctp_machine_id, plate_count, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $4)`,
          [prepressJobId, machine.ctp_machine_id, machine.plate_count, userId]
        );
      }

      // Update prepress_jobs with total plate count and first machine (for backward compatibility)
      const updateQuery = `
        UPDATE prepress_jobs
        SET 
          required_plate_count = $1,
          ctp_machine_id = $2,
          plate_machine_updated_by = $3,
          plate_machine_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await dbAdapter.query(updateQuery, [
        totalPlateCount,
        machines[0].ctp_machine_id, // First machine for backward compatibility
        userId,
        prepressJobId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Failed to update plate info',
          message: 'Prepress job not found'
        });
      }

      // Get all machines for this job
      const machinesQuery = `
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
      `;

      const machinesResult = await dbAdapter.query(machinesQuery, [prepressJobId]);
      const updatedJob = result.rows[0];

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('job_plate_info_updated', {
          jobId: id,
          prepressJobId: prepressJobId,
          requiredPlateCount: totalPlateCount,
          machines: machinesResult.rows,
          updatedBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
          updatedAt: updatedJob.plate_machine_updated_at
        });
      }

      console.log('✅ Plate info updated successfully with multiple machines');

      res.json({
        success: true,
        message: 'Plate info updated successfully',
        job: {
          id: updatedJob.id,
          job_card_id: updatedJob.job_card_id,
          required_plate_count: totalPlateCount,
          machines: machinesResult.rows.map(m => ({
            id: m.ctp_machine_id,
            machine_code: m.machine_code,
            machine_name: m.machine_name,
            machine_type: m.machine_type,
            manufacturer: m.manufacturer,
            model: m.model,
            location: m.location,
            max_plate_size: m.max_plate_size,
            plate_count: m.plate_count
          })),
          ctp_machine: machinesResult.rows.length > 0 ? {
            id: machinesResult.rows[0].ctp_machine_id,
            machine_code: machinesResult.rows[0].machine_code,
            machine_name: machinesResult.rows[0].machine_name,
            machine_type: machinesResult.rows[0].machine_type,
            manufacturer: machinesResult.rows[0].manufacturer,
            model: machinesResult.rows[0].model,
            location: machinesResult.rows[0].location,
            max_plate_size: machinesResult.rows[0].max_plate_size
          } : null,
          plate_machine_updated_by: updatedJob.plate_machine_updated_by,
          plate_machine_updated_at: updatedJob.plate_machine_updated_at
        }
      });
      return;
    }

    // Legacy single machine handling (for backward compatibility)
    const updateQuery = `
      UPDATE prepress_jobs
      SET 
        required_plate_count = COALESCE($1, required_plate_count),
        ctp_machine_id = COALESCE($2, ctp_machine_id),
        plate_machine_updated_by = $3,
        plate_machine_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await dbAdapter.query(updateQuery, [
      required_plate_count !== undefined ? required_plate_count : null,
      ctp_machine_id || null,
      userId,
      prepressJobId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Failed to update plate info',
        message: 'Prepress job not found'
      });
    }

    // Get updated job with machine details
    const jobQuery = `
      SELECT 
        pj.*,
        cm.machine_code,
        cm.machine_name,
        cm.machine_type,
        cm.manufacturer,
        cm.model,
        cm.location,
        cm.max_plate_size
      FROM prepress_jobs pj
      LEFT JOIN ctp_machines cm ON pj.ctp_machine_id = cm.id
      WHERE pj.id = $1
    `;

    const jobResult = await dbAdapter.query(jobQuery, [prepressJobId]);
    const updatedJob = jobResult.rows[0];

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('job_plate_info_updated', {
        jobId: id,
        prepressJobId: prepressJobId,
        requiredPlateCount: updatedJob.required_plate_count,
        ctpMachineId: updatedJob.ctp_machine_id,
        machineName: updatedJob.machine_name,
        updatedBy: req.user?.firstName + ' ' + req.user?.lastName || 'System',
        updatedAt: updatedJob.plate_machine_updated_at
      });
    }

    console.log('✅ Plate info updated successfully');

    res.json({
      success: true,
      message: 'Plate info updated successfully',
      job: {
        id: updatedJob.id,
        job_card_id: updatedJob.job_card_id,
        required_plate_count: updatedJob.required_plate_count,
        ctp_machine: updatedJob.ctp_machine_id ? {
          id: updatedJob.ctp_machine_id,
          machine_code: updatedJob.machine_code,
          machine_name: updatedJob.machine_name,
          machine_type: updatedJob.machine_type,
          manufacturer: updatedJob.manufacturer,
          model: updatedJob.model,
          location: updatedJob.location,
          max_plate_size: updatedJob.max_plate_size
        } : null,
        plate_machine_updated_by: updatedJob.plate_machine_updated_by,
        plate_machine_updated_at: updatedJob.plate_machine_updated_at
      }
    });
  } catch (error) {
    console.error('Error updating plate info:', error);
    res.status(500).json({
      error: 'Failed to update plate info',
      message: error.message
    });
  }
}));

export default router;




