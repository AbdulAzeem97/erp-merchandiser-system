import express from 'express';
import { body, validationResult, query } from 'express-validator';
import pool from '../database/sqlite-config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const jobValidation = [
  body('job_card_id').isLength({ min: 3, max: 50 }).trim(),
  body('product_id').isUUID(),
  body('company_id').optional().isUUID(),
  body('quantity').isInt({ min: 1 }),
  body('delivery_date').isISO8601(),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('status').isIn(['Pending', 'In Progress', 'Quality Check', 'Completed', 'Cancelled'])
];

// Get all jobs with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 }),
  query('status').optional().isIn(['Pending', 'In Progress', 'Quality Check', 'Completed', 'Cancelled']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  query('company_id').optional().isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    search,
    status,
    priority,
    company_id
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramCount = 0;

  // Build WHERE clause
  if (search) {
    paramCount++;
    conditions.push(`(jc.job_card_id ILIKE $${paramCount} OR jc.po_number ILIKE $${paramCount})`);
    params.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    conditions.push(`jc.status = $${paramCount}`);
    params.push(status);
  }

  if (priority) {
    paramCount++;
    conditions.push(`jc.priority = $${paramCount}`);
    params.push(priority);
  }

  if (company_id) {
    paramCount++;
    conditions.push(`jc.company_id = $${paramCount}`);
    params.push(company_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM job_cards jc
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get jobs
  const jobsQuery = `
    SELECT 
      jc.*,
      p.product_item_code,
      p.brand,
      p.product_type,
      c.name as company_name,
      c.code as company_code,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    LEFT JOIN users u ON jc.created_by = u.id
    ${whereClause}
    ORDER BY jc.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const jobsResult = await pool.query(jobsQuery, [...params, limit, offset]);
  const jobs = jobsResult.rows;

  res.json({
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get job by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      jc.*,
      p.product_item_code,
      p.brand,
      p.product_type,
      p.gsm,
      m.name as material_name,
      c.name as company_name,
      c.code as company_code,
      c.contact_person,
      c.email as company_email,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN companies c ON jc.company_id = c.id
    LEFT JOIN users u ON jc.created_by = u.id
    WHERE jc.id = $1
  `;

  const result = await pool.query(query, [id]);

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
    status
  } = req.body;

  // Check if job card ID already exists
  const existingJob = await pool.query(
    'SELECT id FROM job_cards WHERE job_card_id = $1',
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
      job_card_id, product_id, company_id, po_number, quantity, delivery_date,
      target_date, customer_notes, special_instructions, priority, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const result = await pool.query(query, [
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
    req.user?.id || null
  ]);

  const job = result.rows[0];

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
  const existingJob = await pool.query(
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
  const idConflict = await pool.query(
    'SELECT id FROM job_cards WHERE job_card_id = $1 AND id != $2',
    [job_card_id, id]
  );

  if (idConflict.rows.length > 0) {
    return res.status(409).json({
      error: 'Job card ID already exists',
      message: 'A job with this ID already exists'
    });
  }

  // Update job
  const query = `
    UPDATE job_cards SET
      job_card_id = $1,
      product_id = $2,
      company_id = $3,
      po_number = $4,
      quantity = $5,
      delivery_date = $6,
      target_date = $7,
      customer_notes = $8,
      special_instructions = $9,
      priority = $10,
      status = $11,
      progress = $12,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING *
  `;

  const result = await pool.query(query, [
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
    progress,
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
  const existingJob = await pool.query(
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
  await pool.query('DELETE FROM job_cards WHERE id = $1', [id]);

  res.json({
    message: 'Job deleted successfully'
  });
}));

// Get job statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_jobs,
      COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_jobs,
      COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_jobs,
      AVG(progress) as avg_progress
    FROM job_cards
  `;

  const statsResult = await pool.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent jobs
  const recentQuery = `
    SELECT 
      jc.*,
      p.product_item_code,
      p.brand,
      c.name as company_name
    FROM job_cards jc
    LEFT JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    ORDER BY jc.created_at DESC
    LIMIT 5
  `;

  const recentResult = await pool.query(recentQuery);
  const recent = recentResult.rows;

  res.json({
    stats,
    recent
  });
}));

export default router;
