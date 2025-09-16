import express from 'express';
import { body, validationResult, query } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to check if a string is a valid UUID
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Get all materials
router.get('/materials', asyncHandler(async (req, res) => {
  try {
    const result = await dbAdapter.query(`
      SELECT id, name, description, unit, "costPerUnit", "isActive", "createdAt"
      FROM materials
      WHERE "isActive" = true
      ORDER BY name
    `);
    
    res.json({
      materials: result.rows
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch materials'
    });
  }
}));

// Get all categories
router.get('/categories', asyncHandler(async (req, res) => {
  try {
    const result = await dbAdapter.query(`
      SELECT id, name, description, "isActive", "createdAt"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name
    `);
    
    res.json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch categories'
    });
  }
}));

// Validation middleware
const productValidation = [
  body('sku').isLength({ min: 3, max: 100 }).trim(),
  body('brand').optional().isLength({ min: 2, max: 100 }).trim(),
  body('gsm').optional().isInt({ min: 1, max: 1500 }),
  body('category_id').optional(),
  body('description').optional().isLength({ max: 500 })
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

  // Build WHERE clause
  if (search) {
    conditions.push(`(p.sku LIKE $${params.length + 1} OR p.brand LIKE $${params.length + 2} OR p.name LIKE $${params.length + 3})`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (brand) {
    conditions.push(`p.brand = $${params.length + 1}`);
    params.push(brand);
  }

  if (product_type) {
    conditions.push(`p.product_type = $${params.length + 1}`);
    params.push(product_type);
  }

  if (category_id) {
    conditions.push(`p."categoryId" = $${params.length + 1}`);
    params.push(category_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    ${whereClause}
  `;
  const countResult = await dbAdapter.query(countQuery, [...params]);
  const total = parseInt(countResult.rows[0].total);

  // Get products
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  const productsQuery = `
    SELECT
      p.id,
      p.name,
      p.sku as product_item_code,
      p.description,
      p."categoryId",
      p.brand,
      p.gsm,
      p."fscCertified" as fsc,
      p."fscLicense" as fsc_claim,
      p."basePrice",
      p."isActive" as is_active,
      p."createdAt" as created_at,
      p."updatedAt" as updated_at,
      'N/A' as category_name,
      'Offset' as product_type,
      m.name as material_name,
      'As per Approved Sample/Artwork' as color_specifications,
      'Print on Uncoated Side' as remarks
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    ${whereClause}
    ORDER BY p."createdAt" DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}`;

  const productsResult = await dbAdapter.query(productsQuery, [...params, limit, offset]);
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
      COUNT(*) as active,
      COUNT(*) as created_today
    FROM products 
    WHERE "isActive" = true
  `;

  const statsResultResult = await dbAdapter.query(statsQuery);
  const statsResult = statsResultResult.rows?.[0] || {};
  const stats = statsResult;

  // Get recent products
  const recentQuery = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
    LIMIT 5
  `;

  const recentResultResult = await dbAdapter.query(recentQuery);
  const recentResult = recentResultResult.rows || [];
  const recent = recentResult;

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
      COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_products,
      COUNT(DISTINCT brand) as unique_brands,
      COUNT(DISTINCT product_type) as unique_types
    FROM products 
    WHERE "isActive" = true
  `;

  const statsResultResult = await dbAdapter.query(statsQuery);
  const statsResult = statsResultResult.rows?.[0] || {};
  const stats = statsResult;

  // Get recent products
  const recentQuery = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
    LIMIT 5
  `;

  const recentResultResult = await dbAdapter.query(recentQuery);
  const recentResult = recentResultResult.rows || [];
  const recent = recentResult;

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
      p.id,
      p.name,
      p.sku as product_item_code,
      p.description,
      p."categoryId",
      p.brand,
      p.gsm,
      p."fscCertified" as fsc,
      p."fscLicense" as fsc_claim,
      p."basePrice",
      p."isActive" as is_active,
      p."createdAt" as created_at,
      p."updatedAt" as updated_at,
      c.name as category_name,
      u."firstName" || ' ' || u."lastName" as created_by_name,
      'Offset' as product_type,
      m.name as material_name,
      'As per Approved Sample/Artwork' as color_specifications,
      'Print on Uncoated Side' as remarks
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN users u ON p."createdBy" = u.id
    WHERE p.id = $1 AND p."isActive" = true
  `;

  const result = await dbAdapter.query(query, [id]);

  if (!result) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  res.json({
    product: result
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
    sku,
    brand,
    material_id,
    gsm,
    product_type,
    category_id,
    description,
    fsc,
    fsc_claim,
    color_specifications,
    remarks
  } = req.body;

  // Check if product code already exists
  const existingProduct = await dbAdapter.query(
    'SELECT id FROM products WHERE sku = $1',
    [sku]
  );

  if (existingProduct.rows.length > 0) {
    return res.status(409).json({
      error: 'Product code already exists',
      message: 'A product with this code already exists'
    });
  }

  // Handle material_id - validate UUID format
  let finalMaterialId = material_id;
  if (material_id && typeof material_id === 'string') {
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(material_id)) {
      // It's a valid UUID, use it as is
      finalMaterialId = material_id;
    } else {
      // It's a material name, try to find the material
      const materialResult = await dbAdapter.query(
        'SELECT id FROM materials WHERE name = $1 OR code = $1',
        [material_id]
      );
      
      if (materialResult.rows.length > 0) {
        finalMaterialId = materialResult.rows[0].id;
      } else {
        // If material not found, set to null
        finalMaterialId = null;
      }
    }
  }

  // Handle category_id - make it optional
  let finalCategoryId = category_id;
  if (!category_id) {
    // Set to null instead of using a default category
    finalCategoryId = null;
  }

  // Create product - include all the new columns
  const query = `
    INSERT INTO products (
      name, sku, brand, "categoryId", description,
      gsm, "fscCertified", "fscLicense", "basePrice", material_id, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  try {
    const result = await dbAdapter.query(query, [
      sku || 'Unnamed Product', // name field
      sku,
      brand,
      finalCategoryId,
      description || '',
      gsm || null,
      fsc || false, // fscCertified
      fsc_claim || null, // fscLicense
      0, // basePrice default
      finalMaterialId // material_id
    ]);

    const product = result.rows[0];

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Handle foreign key constraint errors
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Invalid reference',
        message: 'The selected material does not exist. Please select a valid material.',
        details: error.detail
      });
    }
    
    // Handle other database errors
    if (error.code) {
      return res.status(400).json({
        error: 'Database error',
        message: 'An error occurred while creating the product',
        details: error.message
      });
    }
    
    throw error;
  }
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
    sku,
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
  const existingProduct = await dbAdapter.query(
    'SELECT id FROM products WHERE id = $1 AND "isActive" = true',
    [id]
  );

  if (existingProduct.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  // Check if new product code conflicts with existing products
  const codeConflict = await dbAdapter.query(
    'SELECT id FROM products WHERE sku = $1 AND id != $2',
    [sku, id]
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
      sku = $1,
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

  const result = await dbAdapter.query(query, [
    sku,
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
  const existingProduct = await dbAdapter.query(
    'SELECT id FROM products WHERE id = $1 AND "isActive" = true',
    [id]
  );

  if (existingProduct.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  // Check if product is used in any job cards
  const jobCards = await dbAdapter.query(
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
  await dbAdapter.query(
    'UPDATE products SET "isActive" = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  res.json({
    message: 'Product deleted successfully'
  });
}));

// Save process selections for a product
router.post('/:id/process-selections', [
  body('selectedSteps').isArray(),
  body('selectedSteps.*').isObject().withMessage('Each selection must be an object'),
  body('selectedSteps.*.step_id').exists().withMessage('step_id is required'),
  body('selectedSteps.*.is_selected').isBoolean().withMessage('is_selected must be a boolean')
], asyncHandler(async (req, res) => {
  console.log('=== Process Selections Validation Debug ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
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
    const productCheck = await dbAdapter.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (!productCheck || productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate that all step IDs exist (step IDs are integers, not UUIDs)
    for (const step of selectedSteps) {
      if (step.is_selected && step.step_id) {
        const stepCheck = await dbAdapter.query('SELECT id FROM process_steps WHERE id = $1', [step.step_id]);
        if (!stepCheck || stepCheck.rows.length === 0) {
          console.log('Invalid step ID:', step.step_id);
          return res.status(400).json({ error: `Invalid step ID: ${step.step_id}` });
        }
      }
    }

    // Clear existing selections for this product
    await dbAdapter.query(
      'DELETE FROM product_step_selections WHERE "productId" = $1',
      [productId]
    );

    // Insert new selections (only the selected ones)
    const validSelections = selectedSteps.filter(step => step.is_selected && step.step_id);
    console.log('Valid selections to save:', validSelections.length, 'out of', selectedSteps.filter(s => s.is_selected).length);

    for (const step of validSelections) {
      console.log('Inserting selection:', {
        productId,
        stepId: step.step_id,
        isSelected: step.is_selected
      });

      await dbAdapter.query(`
        INSERT INTO product_step_selections ("productId", "stepId", is_selected)
        VALUES ($1, $2, $3)
        `, [productId, step.step_id, step.is_selected ? true : false]);
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
      pss."stepId" as step_id,
      ps.name as step_name,
      ps."isQualityCheck" as is_compulsory,
      ps."stepNumber" as step_order,
      pss.is_selected,
      prs.name as product_type,
      prs.description as sequence_description
    FROM product_step_selections pss
    JOIN process_steps ps ON pss."stepId" = ps.id
    JOIN process_sequences prs ON ps."sequenceId" = prs.id
    WHERE pss."productId" = $1
    ORDER BY ps."stepNumber"
  `;

  const result = await dbAdapter.query(query, [productId]);

  res.json({
    product_id: productId,
    selected_steps: result
  });
}));

// Get process sequence with saved selections for a product
router.get('/:id/complete-process-info', asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  // First get the product info
  const productResult = await dbAdapter.query(
    'SELECT * FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found'
    });
  }

  const product = productResult.rows[0];

  // Get the process sequence for the product type
  const productType = product.product_type || 'Offset';
  
  // Get all steps for this product type
  const stepsQuery = `
    SELECT 
      ps.id,
      ps.name,
      ps."isQualityCheck" as is_compulsory,
      ps."stepNumber" as step_order
    FROM process_sequences prs
    JOIN process_steps ps ON prs.id = ps."sequenceId"
    WHERE (prs.name = $1 OR prs.name LIKE $1 || '%') AND prs."isActive" = true AND ps."isActive" = true
    ORDER BY ps."stepNumber"
  `;

  const stepsResult = await dbAdapter.query(stepsQuery, [productType]);

  // Get saved selections for this product
  const selectionsQuery = `
    SELECT "stepId", is_selected
    FROM product_step_selections
    WHERE "productId" = $1
  `;

  const selectionsResult = await dbAdapter.query(selectionsQuery, [productId]);
  const selections = {};
  selectionsResult.rows.forEach(row => {
    selections[row.stepId] = row.is_selected;
  });

  // Merge steps with selections
  const steps = stepsResult.rows.map(step => ({
    id: step.id,
    name: step.name,
    isCompulsory: step.is_compulsory,
    is_compulsory: step.is_compulsory,
    order: step.step_order,
    isSelected: step.is_compulsory || (selections[step.id] === true),
    is_selected: step.is_compulsory || (selections[step.id] === true)
  }));

  res.json({
    product,
    process_sequence: {
      product_type: productType,
      description: `Process sequence for ${productType}`,
      steps: steps
    }
  });
}));

export default router;
