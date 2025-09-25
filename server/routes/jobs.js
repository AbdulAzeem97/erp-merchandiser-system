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
        c.name as company_name,
        jc.customer_name,
        jc.customer_email,
        jc.customer_phone,
        jc.customer_address,
        u."firstName" || ' ' || u."lastName" as assigned_designer_name
      FROM job_cards jc
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN materials m ON p.material_id = m.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u ON jc."assignedToId" = u.id
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
    assigned_designer_id
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
      customer_name, customer_email, customer_phone, customer_address, "assignedToId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
    assigned_designer_id || null // Assigned designer ID
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
router.post('/job-assignment/assign', asyncHandler(async (req, res) => {
  try {
    const { jobCardId, assignedDesignerId, isReassignment = false, priority = 'MEDIUM', dueDate, notes } = req.body;
    
    console.log('🔄 Job assignment request:', { jobCardId, assignedDesignerId, isReassignment, priority, dueDate, notes });
    
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
        d."firstName" || ' ' || d."lastName" as assigned_designer_name
      FROM job_cards jc
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u ON jc."createdById" = u.id
      LEFT JOIN users d ON jc."assignedToId" = d.id
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
        categoryName: 'N/A'
      };
      
      // Fetch complete product data if productId exists
      if (job.productId) {
        try {
          const productResult = await dbAdapter.query(`
            SELECT 
              p.id, p.name, p.sku, p.brand, p.gsm, p."fscCertified", p."fscLicense",
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
              categoryName: product.category_name || 'N/A'
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
        colorSpecifications: 'As per Approved Sample/Artwork', // Default color specs
        remarks: 'Print on Uncoated Side', // Default remarks
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
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
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

export default router;


