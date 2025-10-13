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
        pst.is_compulsory as is_compulsory,
        pst."stepNumber" as step_order,
        COALESCE(pps.is_selected, pst.is_compulsory) as is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst.sequence_id
      LEFT JOIN product_process_selections pps ON pst.id::text = pps.process_step_id::text AND pps.product_id = $2
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
        pst.is_compulsory as is_compulsory,
        pst."stepNumber" as step_order
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst.sequence_id
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
      pst.is_compulsory as is_compulsory,
      pst."stepNumber" as step_order,
      COALESCE(pps.is_selected, pst.is_compulsory) as is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.sequence_id
    LEFT JOIN product_process_selections pps ON pst.id = pps.process_step_id AND pps.product_id = $1
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
      pst.is_compulsory as is_compulsory,
      pst."stepNumber" as step_order,
      pps.is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.sequence_id
    LEFT JOIN product_process_selections pps ON pst.id = pps.process_step_id AND pps.product_id = $1
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
    LEFT JOIN process_steps pst ON ps.id = pst.sequence_id
    WHERE ps."isActive" = true
    GROUP BY ps.id, ps.name, ps.description, ps."isActive", ps."createdAt"
    ORDER BY ps.name ASC
  `;

  const result = await dbAdapter.query(query);
  
  res.json({
    process_sequences: result.rows
  });
}));

// Get process sequence for a specific job
router.get('/for-job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // First get the job to find its product
  const jobResult = await dbAdapter.query(
    'SELECT "productId" FROM job_cards WHERE id = $1',
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The requested job does not exist'
    });
  }

  const productId = jobResult.rows[0].productId;

  // Since product_type is not stored in the database, we'll use 'Offset' as default
  // In a real implementation, you might want to add a product_type column to the products table
  const productType = 'Offset';

  // Get process steps with job-specific selections
  const stepsQuery = `
    SELECT
      ps.id as sequence_id,
      ps.name as product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst.is_compulsory as is_compulsory,
      pst."stepNumber" as step_order,
      COALESCE(jps.is_selected, pst.is_compulsory) as is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.sequence_id
    LEFT JOIN job_process_selections jps ON pst.id = jps.process_step_id AND jps.job_id = $1
    WHERE (ps.name = $2 OR ps.name LIKE $2 || '%') AND ps."isActive" = true AND pst."isActive" = true
    ORDER BY pst."stepNumber" ASC
  `;

  const result = await dbAdapter.query(stepsQuery, [jobId, productType]);

  // Group the results
  const sequence = {
    job_id: jobId,
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

// Save process sequence for a specific job
router.post('/for-job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { steps } = req.body;

  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Steps array is required'
    });
  }

  // Start a transaction
  await dbAdapter.query('BEGIN');

  try {
    // First, clear existing job process selections
    await dbAdapter.query(
      'DELETE FROM job_process_selections WHERE "jobId" = $1',
      [jobId]
    );

    // Insert new selections
    for (const step of steps) {
      if (step.isSelected) {
        await dbAdapter.query(
          'INSERT INTO job_process_selections ("jobId", "processStepId", is_selected, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())',
          [jobId, step.id, true]
        );
      }
    }

    // Commit the transaction
    await dbAdapter.query('COMMIT');

    // Get the updated process sequence
    const updatedSequence = await dbAdapter.query(`
      SELECT
        ps.id as sequence_id,
        ps.name as product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory as is_compulsory,
        pst."stepNumber" as step_order,
        COALESCE(jps.is_selected, pst.is_compulsory) as is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst.sequence_id
      LEFT JOIN job_process_selections jps ON pst.id = jps.process_step_id AND jps.job_id = $1
      WHERE ps."isActive" = true AND pst."isActive" = true
      ORDER BY pst."stepNumber" ASC
    `, [jobId]);

    const sequence = {
      job_id: jobId,
      product_type: updatedSequence.rows[0]?.product_type || '',
      description: updatedSequence.rows[0]?.description || '',
      steps: updatedSequence.rows.map(row => ({
        id: row.step_id,
        name: row.step_name,
        isCompulsory: row.is_compulsory,
        order: row.step_order,
        isSelected: row.is_selected !== null ? row.is_selected : row.is_compulsory
      }))
    };

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('job_updates').emit('process_sequence_updated', {
        jobId: parseInt(jobId),
        processSequence: sequence,
        updatedBy: req.user?.id,
        updatedAt: new Date().toISOString()
      });
      console.log(`📡 Emitted process_sequence_updated event for job ${jobId}`);
    }

    res.json({
      success: true,
      message: 'Process sequence updated successfully',
      process_sequence: sequence
    });

  } catch (error) {
    // Rollback the transaction
    await dbAdapter.query('ROLLBACK');
    throw error;
  }
}));

export default router;
