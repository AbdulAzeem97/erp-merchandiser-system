import express from 'express';
import { body, validationResult, query } from 'express-validator';
import pool from '../database/sqlite-config.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation middleware
const productValidation = [
  body('product_item_code').isLength({ min: 3, max: 100 }).trim(),
  body('brand').isLength({ min: 2, max: 100 }).trim(),
  body('gsm').isInt({ min: 50, max: 500 }),
  body('product_type').isLength({ min: 2, max: 100 }).trim(),
  body('material_id').optional(),
  body('category_id').optional()
];

// Get all products with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 }),
  query('brand').optional().isLength({ min: 1 }),
  query('product_type').optional().isLength({ min: 1 }),
  query('category_id').optional().isUUID()
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
    brand,
    product_type,
    category_id
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramCount = 0;

  // Build WHERE clause
  if (search) {
    paramCount++;
    conditions.push(`(p.product_item_code ILIKE $${paramCount} OR p.brand ILIKE $${paramCount} OR p.product_type ILIKE $${paramCount})`);
    params.push(`%${search}%`);
  }

  if (brand) {
    paramCount++;
    conditions.push(`p.brand = $${paramCount}`);
    params.push(brand);
  }

  if (product_type) {
    paramCount++;
    conditions.push(`p.product_type = $${paramCount}`);
    params.push(product_type);
  }

  if (category_id) {
    paramCount++;
    conditions.push(`p.category_id = $${paramCount}`);
    params.push(category_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get products
  const productsQuery = `
    SELECT 
      p.*,
      m.name as material_name,
      m.code as material_code,
      pc.name as category_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN users u ON p.created_by = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const productsResult = await pool.query(productsQuery, [...params, limit, offset]);
  const products = productsResult.rows;

  res.json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get product statistics (for dashboard) - MUST BE BEFORE /:id ROUTE
router.get('/stats', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active,
      COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as created_today
    FROM products 
    WHERE is_active = 1
  `;

  const statsResult = await pool.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent products
  const recentQuery = `
    SELECT 
      p.*,
      m.name as material_name,
      pc.name as category_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  const recentResult = await pool.query(recentQuery);
  const recent = recentResult.rows;

  res.json({
    total: parseInt(stats.total),
    active: parseInt(stats.active),
    created_today: parseInt(stats.created_today),
    recent
  });
}));

// Get product statistics (detailed) - MUST BE BEFORE /:id ROUTE
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_products,
      COUNT(DISTINCT brand) as unique_brands,
      COUNT(DISTINCT product_type) as unique_types
    FROM products 
    WHERE is_active = 1
  `;

  const statsResult = await pool.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent products
  const recentQuery = `
    SELECT 
      p.*,
      m.name as material_name,
      pc.name as category_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  const recentResult = await pool.query(recentQuery);
  const recent = recentResult.rows;

  res.json({
    stats,
    recent
  });
}));

// Get product by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      p.*,
      m.name as material_name,
      m.code as material_code,
      m.type as material_type,
      pc.name as category_name,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = $1 AND p.is_active = 1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  res.json({
    product: result.rows[0]
  });
}));

// Create new product
router.post('/', productValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const {
    product_item_code,
    brand,
    material_id,
    gsm,
    product_type,
    category_id,
    fsc,
    fsc_claim,
    color_specifications,
    remarks
  } = req.body;

  // Check if product code already exists
  const existingProduct = await pool.query(
    'SELECT id FROM products WHERE product_item_code = $1',
    [product_item_code]
  );

  if (existingProduct.rows.length > 0) {
    return res.status(409).json({
      error: 'Product code already exists',
      message: 'A product with this code already exists'
    });
  }

  // Handle material_id - if it's a string, find or create the material
  let finalMaterialId = material_id;
  if (material_id && typeof material_id === 'string' && !material_id.includes('-')) {
    // It's a material name, find or create the material
    const materialResult = await pool.query(
      'SELECT id FROM materials WHERE name = $1 OR code = $1',
      [material_id]
    );
    
    if (materialResult.rows.length > 0) {
      finalMaterialId = materialResult.rows[0].id;
    } else {
      // Create a new material
      const newMaterialResult = await pool.query(
        'INSERT INTO materials (name, code, type, gsm_range, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [material_id, material_id.substring(0, 6).toUpperCase(), 'Paper', '200-300 GSM', `Auto-created material: ${material_id}`]
      );
      finalMaterialId = newMaterialResult.rows[0].id;
    }
  }

  // Handle category_id - if it's null, use a default category
  let finalCategoryId = category_id;
  if (!category_id) {
    const defaultCategoryResult = await pool.query(
      'SELECT id FROM product_categories LIMIT 1'
    );
    if (defaultCategoryResult.rows.length > 0) {
      finalCategoryId = defaultCategoryResult.rows[0].id;
    }
  }

  // Create product
  const query = `
    INSERT INTO products (
      product_item_code, brand, material_id, gsm, product_type, category_id,
      fsc, fsc_claim, color_specifications, remarks, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await pool.query(query, [
    product_item_code,
    brand,
    finalMaterialId,
    gsm,
    product_type,
    finalCategoryId,
    fsc,
    fsc_claim,
    color_specifications,
    remarks,
    req.user?.id || null
  ]);

  const product = result.rows[0];

  res.status(201).json({
    message: 'Product created successfully',
    product
  });
}));

// Update product
router.put('/:id', productValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { id } = req.params;
  const {
    product_item_code,
    brand,
    material_id,
    gsm,
    product_type,
    category_id,
    fsc,
    fsc_claim,
    color_specifications,
    remarks
  } = req.body;

  // Check if product exists
  const existingProduct = await pool.query(
    'SELECT id FROM products WHERE id = $1 AND is_active = 1',
    [id]
  );

  if (existingProduct.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  // Check if new product code conflicts with existing products
  const codeConflict = await pool.query(
    'SELECT id FROM products WHERE product_item_code = $1 AND id != $2',
    [product_item_code, id]
  );

  if (codeConflict.rows.length > 0) {
    return res.status(409).json({
      error: 'Product code already exists',
      message: 'A product with this code already exists'
    });
  }

  // Update product
  const query = `
    UPDATE products SET
      product_item_code = $1,
      brand = $2,
      material_id = $3,
      gsm = $4,
      product_type = $5,
      category_id = $6,
      fsc = $7,
      fsc_claim = $8,
      color_specifications = $9,
      remarks = $10,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *
  `;

  const result = await pool.query(query, [
    product_item_code,
    brand,
    material_id,
    gsm,
    product_type,
    category_id,
    fsc,
    fsc_claim,
    color_specifications,
    remarks,
    id
  ]);

  const product = result.rows[0];

  res.json({
    message: 'Product updated successfully',
    product
  });
}));

// Delete product (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product exists
  const existingProduct = await pool.query(
    'SELECT id FROM products WHERE id = $1 AND is_active = 1',
    [id]
  );

  if (existingProduct.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  // Check if product is used in any job cards
  const jobCards = await pool.query(
    'SELECT id FROM job_cards WHERE product_id = $1',
    [id]
  );

  if (jobCards.rows.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete product',
      message: 'This product is being used in job cards and cannot be deleted'
    });
  }

  // Soft delete
  await pool.query(
    'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  res.json({
    message: 'Product deleted successfully'
  });
}));

// Save process selections for a product
router.post('/:id/process-selections', [
  body('selectedSteps').isArray(),
  body('selectedSteps.*.step_id').isUUID(),
  body('selectedSteps.*.is_selected').isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { id: productId } = req.params;
  const { selectedSteps } = req.body;

  console.log('=== Process Selections Debug ===');
  console.log('Product ID:', productId);
  console.log('Selected Steps:', JSON.stringify(selectedSteps, null, 2));

  try {
    // Validate that product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate that all step IDs exist
    for (const step of selectedSteps) {
      if (step.is_selected) {
        const stepCheck = await pool.query('SELECT id FROM process_steps WHERE id = $1', [step.step_id]);
        if (!stepCheck.rows || stepCheck.rows.length === 0) {
          console.log('Invalid step ID:', step.step_id);
          return res.status(400).json({ error: `Invalid step ID: ${step.step_id}` });
        }
      }
    }

    // Clear existing selections for this product
    await pool.query(
      'DELETE FROM product_process_selections WHERE product_id = $1',
      [productId]
    );

    // Insert new selections (only the selected ones)
    for (const step of selectedSteps) {
      if (step.is_selected) {
        console.log('Inserting selection:', {
          productId,
          stepId: step.step_id,
          isSelected: step.is_selected
        });
        
        await pool.query(`
          INSERT INTO product_process_selections (id, product_id, process_step_id, is_selected)
          VALUES ($1, $2, $3, $4)
        `, [uuidv4(), productId, step.step_id, step.is_selected ? 1 : 0]);
      }
    }

    res.json({
      message: 'Process selections saved successfully',
      selections: selectedSteps.filter(s => s.is_selected)
    });
  } catch (error) {
    console.error('Process selections save error:', error);
    throw error;
  }
}));

// Get process selections for a product
router.get('/:id/process-selections', asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  const query = `
    SELECT 
      pps.process_step_id,
      ps.name as step_name,
      ps.is_compulsory,
      ps.step_order,
      pps.is_selected,
      prs.product_type,
      prs.description as sequence_description
    FROM product_process_selections pps
    JOIN process_steps ps ON pps.process_step_id = ps.id
    JOIN process_sequences prs ON ps.process_sequence_id = prs.id
    WHERE pps.product_id = $1
    ORDER BY ps.step_order
  `;

  const result = await pool.query(query, [productId]);

  res.json({
    product_id: productId,
    selected_steps: result.rows
  });
}));

// Get process sequence with saved selections for a product
router.get('/:id/complete-process-info', asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  // First get the product info
  const productResult = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND is_active = 1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found'
    });
  }

  const product = productResult.rows[0];

  // Get all process steps for this product type
  const stepsQuery = `
    SELECT 
      ps.id,
      ps.name,
      ps.is_compulsory,
      ps.step_order,
      ps.is_active,
      prs.product_type,
      COALESCE(pps.is_selected, ps.is_compulsory) as is_selected
    FROM process_sequences prs
    JOIN process_steps ps ON prs.id = ps.process_sequence_id
    LEFT JOIN product_process_selections pps ON ps.id = pps.process_step_id AND pps.product_id = $1
    WHERE prs.product_type = $2 AND ps.is_active = 1
    ORDER BY ps.step_order
  `;

  const stepsResult = await pool.query(stepsQuery, [productId, product.product_type]);

  res.json({
    product,
    process_sequence: {
      product_type: product.product_type,
      steps: stepsResult.rows
    }
  });
}));

export default router;
