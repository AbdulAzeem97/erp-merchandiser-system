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
        ps.product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory,
        pst.step_order,
        COALESCE(pps.is_selected, pst.is_compulsory) as is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst.process_sequence_id
      LEFT JOIN product_process_selections pps ON pst.id = pps.process_step_id AND pps.product_id = $2
      WHERE ps.product_type = $1 AND ps.is_active = true AND pst.is_active = true
      AND (pst.is_compulsory = 1 OR pps.is_selected = 1)
      ORDER BY pst.step_order ASC
    `;
    params = [product_type, product_id];
  } else {
    // Get all process steps for the product type (original behavior)
    query = `
      SELECT 
        ps.id as sequence_id,
        ps.product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory,
        pst.step_order
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst.process_sequence_id
      WHERE ps.product_type = $1 AND ps.is_active = true
      ORDER BY pst.step_order ASC
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
    'SELECT product_type FROM products WHERE id = $1 AND is_active = true',
    [productId]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Product not found',
      message: 'The requested product does not exist'
    });
  }

  const productType = productResult.rows[0].product_type;

  // Get process steps with product-specific selections (compulsory + selected optional only)
  const stepsQuery = `
    SELECT 
      ps.id as sequence_id,
      ps.product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst.is_compulsory,
      pst.step_order,
      COALESCE(pps.is_selected, pst.is_compulsory) as is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.process_sequence_id
    LEFT JOIN product_process_selections pps ON pst.id = pps.process_step_id AND pps.product_id = $1
    WHERE ps.product_type = $2 AND ps.is_active = true AND pst.is_active = true
    AND (pst.is_compulsory = 1 OR pps.is_selected = 1)
    ORDER BY pst.step_order ASC
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
      isSelected: row.is_selected
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
      ps.product_type,
      ps.description,
      ps.is_active,
      ps.created_at,
      COUNT(pst.id) as step_count
    FROM process_sequences ps
    LEFT JOIN process_steps pst ON ps.id = pst.process_sequence_id
    WHERE ps.is_active = true
    GROUP BY ps.id, ps.product_type, ps.description, ps.is_active, ps.created_at
    ORDER BY ps.product_type ASC
  `;

  const result = await dbAdapter.query(query);
  
  res.json({
    process_sequences: result.rows
  });
}));

export default router;
