import express from 'express';
import { query, validationResult } from 'express-validator';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get process sequences by product type (with optional product-specific filtering)
router.get('/by-product-type', [
  query('product_type').isString().trim().notEmpty(),
  query('product_id').optional().isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array()
    });
  }

  const { product_type, product_id } = req.query;

  let query, params;

  if (product_id) {
    // Get process steps with product-specific selections (compulsory + selected optional only)
    query = `
      SELECT
        ps.id as sequence_id,
        ps.name as product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."stepNumber" as step_order,
        COALESCE(pps.is_selected, pst."isQualityCheck") as is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst."sequenceId"
      LEFT JOIN product_process_selections pps ON pst.id::text = pps."processStepId"::text AND pps."productId" = $2
      WHERE (ps.name = $1 OR ps.name LIKE $1 || '%') AND ps."isActive" = true AND pst."isActive" = true
      ORDER BY pst."stepNumber" ASC
    `;
    params = [product_type, product_id];
  } else {
    // Get all process steps for the product type (original behavior)
    query = `
      SELECT
        ps.id as sequence_id,
        ps.name as product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."stepNumber" as step_order
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE (ps.name = $1 OR ps.name LIKE $1 || '%') AND ps."isActive" = true
      ORDER BY pst."stepNumber" ASC
    `;
    params = [product_type];
  }

  const result = await dbAdapter.query(query, params);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Process sequence not found',
      message: `No process sequence found for product type: ${product_type}`
    });
  }

  // Group the results
  const sequence = {
    product_type: result.rows[0].product_type,
    description: result.rows[0].description,
    steps: result.rows
      .filter(row => row.step_id) // Only include rows with steps
      .map(row => ({
        id: row.step_id,
        name: row.step_name,
        isCompulsory: row.is_compulsory,
        order: row.step_order,
        isSelected: row.is_selected !== undefined ? row.is_selected : row.is_compulsory
      }))
  };

  res.json({
    process_sequence: sequence
  });
}));

// Get process steps for a specific product (used by job cards)
router.get('/for-product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // First get the product to find its type
  const productResult = await dbAdapter.query(
    'SELECT product_type FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  const productType = productResult.rows[0].product_type;

  // Get all process steps for this product type with selection info
  const stepsQuery = `
    SELECT
      ps.id as sequence_id,
      ps.name as product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst."isQualityCheck" as is_compulsory,
      pst."stepNumber" as step_order,
      COALESCE(pps.is_selected, pst."isQualityCheck") as is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst."sequenceId"
    LEFT JOIN product_process_selections pps ON pst.id = pps."processStepId" AND pps."productId" = $1
    WHERE (ps.name = $2 OR ps.name LIKE $2 || '%') AND ps."isActive" = true AND pst."isActive" = true
    ORDER BY pst."stepNumber" ASC
  `;

  const result = await dbAdapter.query(stepsQuery, [productId, productType]);

  // Group the results
  const sequence = {
    product_id: productId,
    product_type: productType,
    description: result.rows[0]?.description || '',
    steps: result.rows.map(row => ({
      id: row.step_id,
      name: row.step_name,
      isCompulsory: row.is_compulsory,
      order: row.step_order,
      isSelected: row.is_selected !== null ? row.is_selected : row.is_compulsory
    }))
  };

  res.json({
    process_sequence: sequence
  });
}));

// Simple endpoint to get process steps for a product without boolean issues
router.get('/simple-for-product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // First get the product to find its type
  const productResult = await dbAdapter.query(
    'SELECT product_type FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  const productType = productResult.rows[0].product_type;

  // Get all process steps with minimal filtering
  const stepsQuery = `
    SELECT
      ps.id as sequence_id,
      ps.name as product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst."isQualityCheck" as is_compulsory,
      pst."stepNumber" as step_order,
      pps.is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst."sequenceId"
    LEFT JOIN product_process_selections pps ON pst.id = pps."processStepId" AND pps."productId" = $1
    WHERE ps.name = $2
    ORDER BY pst."stepNumber" ASC
  `;

  const result = await dbAdapter.query(stepsQuery, [productId, productType]);

  // Filter in JavaScript instead of SQL to avoid boolean comparison issues
  const allSteps = result.rows;
  const filteredSteps = allSteps.filter(row => {
    return row.is_compulsory || (row.is_selected !== null && row.is_selected === true);
  });

  const sequence = {
    product_id: productId,
    product_type: productType,
    description: result.rows[0]?.description || '',
    steps: filteredSteps.map(row => ({
      id: row.step_id,
      name: row.step_name,
      isCompulsory: row.is_compulsory,
      order: row.step_order,
      isSelected: row.is_selected !== null ? row.is_selected : row.is_compulsory
    }))
  };

  res.json({
    process_sequence: sequence
  });
}));

// Get all process sequences
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      ps.id,
      ps.name as product_type,
      ps.description,
      ps."isActive" as is_active,
      ps."createdAt" as created_at,
      COUNT(pst.id) as step_count
    FROM process_sequences ps
    LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
    WHERE ps."isActive" = true
    GROUP BY ps.id, ps.name, ps.description, ps."isActive", ps."createdAt"
    ORDER BY ps.name ASC
  `;

  const result = await dbAdapter.query(query);
  
  res.json({
    process_sequences: result.rows
  });
}));

export default router;
