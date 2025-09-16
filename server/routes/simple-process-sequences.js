import express from 'express';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Simple endpoint to get process steps for a product without boolean comparison issues
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

  // Get all process steps for this product type with basic selection info
  const stepsQuery = `
    SELECT
      ps.id as sequence_id,
      ps.product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst.is_compulsory,
      pst.step_order,
      pps.is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.process_sequence_id
    LEFT JOIN product_process_selections pps ON pst.id = pps.step_id AND pps.product_id = $1
    WHERE ps.product_type = $2
    ORDER BY pst.step_order ASC
  `;

  const result = await dbAdapter.query(stepsQuery, [productId, productType]);

  // Filter and group the results in JavaScript instead of SQL
  const allSteps = result.rows;
  const filteredSteps = allSteps.filter(row => {
    // Include compulsory steps OR steps that are explicitly selected
    return row.is_compulsory || (row.is_selected !== null && row.is_selected);
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

export default router;