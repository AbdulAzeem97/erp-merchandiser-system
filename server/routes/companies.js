import express from 'express';
import { body, validationResult, query } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const companyValidation = [
  body('name').isLength({ min: 2, max: 255 }).trim(),
  body('code').isLength({ min: 2, max: 50 }).trim(),
  body('contact_person').optional().isLength({ min: 2, max: 255 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isLength({ min: 5, max: 50 }).trim(),
  body('country').optional().isLength({ min: 2, max: 100 }).trim()
];

// Get all companies with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 }),
  query('country').optional().isLength({ min: 1 })
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
    country
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramCount = 0;

  // Build WHERE clause
  if (search) {
    paramCount++;
    conditions.push(`(c.name ILIKE $${paramCount} OR c.code ILIKE $${paramCount} OR c.contact_person ILIKE $${paramCount})`);
    params.push(`%${search}%`);
  }

  if (country) {
    paramCount++;
    conditions.push(`c.country = $${paramCount}`);
    params.push(country);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM companies c
    ${whereClause}
  `;
  const countResult = await dbAdapter.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get companies
  const companiesQuery = `
    SELECT 
      c.*,
      COUNT(jc.id) as job_count
    FROM companies c
    LEFT JOIN job_cards jc ON c.id = jc.company_id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const companiesResult = await dbAdapter.query(companiesQuery, [...params, limit, offset]);
  const companies = companiesResult.rows;

  res.json({
    companies,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get company by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      c.*,
      COUNT(jc.id) as job_count,
      COUNT(CASE WHEN jc.status = 'Completed' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN jc.status = 'In Progress' THEN 1 END) as active_jobs
    FROM companies c
    LEFT JOIN job_cards jc ON c.id = jc.company_id
    WHERE c.id = $1
    GROUP BY c.id
  `;

  const result = await dbAdapter.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Company not found',
      message: 'The requested company does not exist'
    });
  }

  res.json({
    company: result.rows[0]
  });
}));

// Create new company
router.post('/', companyValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const {
    name,
    code,
    contact_person,
    email,
    phone,
    address,
    country
  } = req.body;

  // Check if company code already exists
  const existingCompany = await dbAdapter.query(
    'SELECT id FROM companies WHERE code = $1',
    [code]
  );

  if (existingCompany.rows.length > 0) {
    return res.status(409).json({
      error: 'Company code already exists',
      message: 'A company with this code already exists'
    });
  }

  // Create company
  const query = `
    INSERT INTO companies (name, code, contact_person, email, phone, address, country)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await dbAdapter.query(query, [
    name,
    code,
    contact_person,
    email,
    phone,
    address,
    country
  ]);

  const company = result.rows[0];

  res.status(201).json({
    message: 'Company created successfully',
    company
  });
}));

// Update company
router.put('/:id', companyValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const {
    name,
    code,
    contact_person,
    email,
    phone,
    address,
    country
  } = req.body;

  // Check if company exists
  const existingCompany = await dbAdapter.query(
    'SELECT id FROM companies WHERE id = $1 AND is_active = true',
    [id]
  );

  if (existingCompany.rows.length === 0) {
    return res.status(404).json({
      error: 'Company not found',
      message: 'The requested company does not exist'
    });
  }

  // Check if new company code conflicts with existing companies
  const codeConflict = await dbAdapter.query(
    'SELECT id FROM companies WHERE code = $1 AND id != $2',
    [code, id]
  );

  if (codeConflict.rows.length > 0) {
    return res.status(409).json({
      error: 'Company code already exists',
      message: 'A company with this code already exists'
    });
  }

  // Update company
  const query = `
    UPDATE companies SET
      name = $1,
      code = $2,
      contact_person = $3,
      email = $4,
      phone = $5,
      address = $6,
      country = $7,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
  `;

  const result = await dbAdapter.query(query, [
    name,
    code,
    contact_person,
    email,
    phone,
    address,
    country,
    id
  ]);

  const company = result.rows[0];

  res.json({
    message: 'Company updated successfully',
    company
  });
}));

// Delete company (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if company exists
  const existingCompany = await dbAdapter.query(
    'SELECT id FROM companies WHERE id = $1 AND is_active = true',
    [id]
  );

  if (existingCompany.rows.length === 0) {
    return res.status(404).json({
      error: 'Company not found',
      message: 'The requested company does not exist'
    });
  }

  // Check if company has active jobs
  const activeJobs = await dbAdapter.query(
    'SELECT id FROM job_cards WHERE company_id = $1 AND status IN ($2, $3)',
    [id, 'Pending', 'In Progress']
  );

  if (activeJobs.rows.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete company',
      message: 'This company has active jobs and cannot be deleted'
    });
  }

  // Soft delete
  await dbAdapter.query(
    'UPDATE companies SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  res.json({
    message: 'Company deleted successfully'
  });
}));

// Get company statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_companies,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_companies,
      COUNT(DISTINCT country) as unique_countries,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_companies
    FROM companies
  `;

  const statsResult = await dbAdapter.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent companies
  const recentQuery = `
    SELECT 
      c.*,
      COUNT(jc.id) as job_count
    FROM companies c
    LEFT JOIN job_cards jc ON c.id = jc.company_id
    WHERE c.is_active = true
    GROUP BY c.id
    ORDER BY c.created_at DESC
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
