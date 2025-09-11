import express from 'express';
import { body, query, validationResult } from 'express-validator';
import inventoryService from '../services/inventoryService.js';
import dbAdapter from '../database/adapter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const materialValidation = [
  body('material_id').isUUID(),
  body('category_id').optional().isUUID(),
  body('unit_of_measurement').isIn(['sheets', 'kg', 'rolls', 'pcs', 'meters', 'liters']),
  body('unit_cost').optional().isDecimal({ decimal_digits: '0,2' }),
  body('minimum_stock_level').isInt({ min: 0 }),
  body('reorder_level').isInt({ min: 0 }),
  body('maximum_stock_level').isInt({ min: 1 })
];

const jobApprovalValidation = [
  body('status').isIn(['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PENDING_PROCUREMENT']),
  body('approval_percentage').optional().isDecimal({ min: 0, max: 100 }),
  body('special_approval_reason').optional().isLength({ min: 5, max: 500 }),
  body('remarks').optional().isLength({ max: 1000 })
];

// Dashboard - Inventory Overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const dashboard = await inventoryService.getInventoryDashboard();
  res.json(dashboard);
}));

// Materials Management
router.get('/materials', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category_id').optional().isUUID(),
  query('low_stock').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const { page = 1, limit = 20, category_id, low_stock } = req.query;
  const offset = (page - 1) * limit;
  
  const conditions = ['im.is_active = true'];
  const params = [];
  let paramCount = 0;

  if (category_id) {
    paramCount++;
    conditions.push(`im.category_id = $${paramCount}`);
    params.push(category_id);
  }

  if (low_stock === 'true') {
    conditions.push('s.available_stock <= im.minimum_stock_level');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(DISTINCT im.id) as total
    FROM inventory_materials im
    LEFT JOIN inventory_stock s ON im.id = s.inventory_material_id
    ${whereClause}
  `;
  
  const countResult = await dbAdapter.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  const materialsQuery = `
    SELECT 
      im.*,
      m.name as material_name,
      m.code as material_code,
      m.type as material_type,
      mc.name as category_name,
      s.current_stock,
      s.reserved_stock,
      s.available_stock,
      s.stock_value,
      CASE 
        WHEN s.available_stock <= im.minimum_stock_level THEN 'CRITICAL'
        WHEN s.available_stock <= im.reorder_level THEN 'LOW'
        ELSE 'NORMAL'
      END as stock_status
    FROM inventory_materials im
    JOIN materials m ON im.material_id = m.id
    LEFT JOIN material_categories mc ON im.category_id = mc.id
    LEFT JOIN inventory_stock s ON im.id = s.inventory_material_id
    ${whereClause}
    ORDER BY im.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const materialsResult = await dbAdapter.query(materialsQuery, [...params, limit, offset]);
  
  res.json({
    materials: materialsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.post('/materials', materialValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const material = await inventoryService.createInventoryMaterial(req.body);
  res.status(201).json({ message: 'Inventory material created successfully', material });
}));

// Stock Management
router.get('/stock/:material_id', asyncHandler(async (req, res) => {
  const { material_id } = req.params;
  
  const stockQuery = `
    SELECT 
      s.*,
      im.*,
      m.name as material_name,
      m.code as material_code,
      mc.name as category_name
    FROM inventory_stock s
    JOIN inventory_materials im ON s.inventory_material_id = im.id
    JOIN materials m ON im.material_id = m.id
    LEFT JOIN material_categories mc ON im.category_id = mc.id
    WHERE im.id = $1
  `;

  const result = await dbAdapter.query(stockQuery, [material_id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Stock record not found' });
  }

  // Get recent movements
  const movementsQuery = `
    SELECT 
      sm.*,
      u.first_name || ' ' || u.last_name as performed_by_name
    FROM stock_movements sm
    JOIN users u ON sm.performed_by = u.id
    WHERE sm.inventory_stock_id = $1
    ORDER BY sm.performed_at DESC
    LIMIT 10
  `;

  const movementsResult = await dbAdapter.query(movementsQuery, [result.rows[0].id]);
  
  res.json({
    stock: result.rows[0],
    recent_movements: movementsResult.rows
  });
}));

router.post('/stock/receive', [
  body('inventory_material_id').isUUID(),
  body('quantity').isInt({ min: 1 }),
  body('unit_cost').isDecimal({ decimal_digits: '0,2' }),
  body('reference_id').isLength({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const { inventory_material_id, quantity, unit_cost, reference_id } = req.body;
  
  const result = await inventoryService.receiveStock(
    inventory_material_id,
    quantity,
    unit_cost,
    reference_id,
    req.user?.id
  );

  res.json({ message: 'Stock received successfully', ...result });
}));

router.post('/stock/adjust', [
  body('inventory_material_id').isUUID(),
  body('adjustment_quantity').isInt(),
  body('reason').isLength({ min: 5, max: 200 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const { inventory_material_id, adjustment_quantity, reason } = req.body;
  
  const stockId = await inventoryService.getStockId(inventory_material_id);
  
  // Perform adjustment
  const updateQuery = `
    UPDATE inventory_stock 
    SET current_stock = current_stock + $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE inventory_material_id = $2
  `;
  
  await dbAdapter.query(updateQuery, [adjustment_quantity, inventory_material_id]);

  // Record movement
  await inventoryService.recordStockMovement(pool, {
    inventory_stock_id: stockId,
    movement_type: 'ADJUSTMENT',
    quantity: Math.abs(adjustment_quantity),
    reference_type: 'ADJUSTMENT',
    reference_id: `ADJ-${Date.now()}`,
    performed_by: req.user?.id,
    reason
  });

  res.json({ message: 'Stock adjusted successfully', adjustment_quantity });
}));

// Job Material Management
router.get('/jobs/pending', asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      jc.*,
      p.product_item_code,
      p.brand,
      c.name as company_name,
      ija.status as approval_status,
      ija.approval_percentage,
      ija.remarks as approval_remarks
    FROM job_cards jc
    JOIN products p ON jc.product_id = p.id
    LEFT JOIN companies c ON jc.company_id = c.id
    LEFT JOIN inventory_job_approvals ija ON jc.id = ija.job_card_id
    WHERE jc.status = 'Pending' OR ija.status = 'PENDING'
    ORDER BY jc.priority DESC, jc.delivery_date ASC
  `;

  const result = await dbAdapter.query(query);
  res.json({ jobs: result.rows });
}));

router.post('/jobs/:job_id/analyze', asyncHandler(async (req, res) => {
  const { job_id } = req.params;
  const { materials_required } = req.body; // Array of {inventory_material_id, required_quantity, priority}

  if (!materials_required || !Array.isArray(materials_required)) {
    return res.status(400).json({ 
      error: 'Materials required array is mandatory',
      expected_format: '[{inventory_material_id: uuid, required_quantity: number, priority?: number}]'
    });
  }

  const analysis = await inventoryService.processJobMaterialRequirements(
    job_id,
    materials_required,
    req.user?.id
  );

  res.json({ message: 'Job material analysis completed', analysis });
}));

router.post('/jobs/:job_id/approve', jobApprovalValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const { job_id } = req.params;
  
  const approval = await inventoryService.approveJobWithMaterials(
    job_id,
    req.body,
    req.user?.id
  );

  res.json({ message: 'Job approval processed successfully', approval });
}));

router.get('/jobs/:job_id/materials', asyncHandler(async (req, res) => {
  const { job_id } = req.params;
  
  const query = `
    SELECT 
      jmr.*,
      m.name as material_name,
      m.code as material_code,
      im.unit_of_measurement,
      s.current_stock,
      s.available_stock
    FROM job_material_requirements jmr
    JOIN inventory_materials im ON jmr.inventory_material_id = im.id
    JOIN materials m ON im.material_id = m.id
    LEFT JOIN inventory_stock s ON im.id = s.inventory_material_id
    WHERE jmr.job_card_id = $1
    ORDER BY jmr.priority DESC, jmr.created_at
  `;

  const result = await dbAdapter.query(query, [job_id]);
  
  res.json({ materials: result.rows });
}));

// Purchase Requests
router.get('/purchase-requests', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'])
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  const params = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    conditions.push(`pr.status = $${paramCount}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as total FROM purchase_requests pr ${whereClause}`;
  const countResult = await dbAdapter.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  const requestsQuery = `
    SELECT 
      pr.*,
      u1.first_name || ' ' || u1.last_name as requested_by_name,
      u2.first_name || ' ' || u2.last_name as approved_by_name
    FROM purchase_requests pr
    LEFT JOIN users u1 ON pr.requested_by = u1.id
    LEFT JOIN users u2 ON pr.approved_by = u2.id
    ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const requestsResult = await dbAdapter.query(requestsQuery, [...params, limit, offset]);
  
  res.json({
    purchase_requests: requestsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.post('/purchase-requests', [
  body('materials').isArray({ min: 1 }),
  body('materials.*.inventory_material_id').isUUID(),
  body('materials.*.quantity').isInt({ min: 1 }),
  body('materials.*.estimated_unit_cost').optional().isDecimal(),
  body('reason').isLength({ min: 5, max: 500 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() });
  }

  const { materials, reason } = req.body;
  
  const request = await inventoryService.createPurchaseRequest(
    materials,
    req.user?.id,
    reason
  );

  res.status(201).json({ message: 'Purchase request created successfully', request });
}));

// Stock Alerts
router.get('/alerts', [
  query('status').optional().isIn(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']),
  query('alert_type').optional().isIn(['LOW_STOCK', 'REORDER_POINT', 'OVERSTOCK', 'EXPIRY_WARNING'])
], asyncHandler(async (req, res) => {
  const { status = 'ACTIVE', alert_type } = req.query;
  
  const conditions = [`sa.status = '${status}'`];
  const params = [];
  let paramCount = 0;

  if (alert_type) {
    paramCount++;
    conditions.push(`sa.alert_type = $${paramCount}`);
    params.push(alert_type);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const alertsQuery = `
    SELECT 
      sa.*,
      m.name as material_name,
      m.code as material_code,
      im.unit_of_measurement,
      u.first_name || ' ' || u.last_name as acknowledged_by_name
    FROM stock_alerts sa
    JOIN inventory_materials im ON sa.inventory_material_id = im.id
    JOIN materials m ON im.material_id = m.id
    LEFT JOIN users u ON sa.acknowledged_by = u.id
    ${whereClause}
    ORDER BY sa.created_at DESC
  `;

  const result = await dbAdapter.query(alertsQuery, params);
  
  res.json({ alerts: result.rows });
}));

router.put('/alerts/:alert_id/acknowledge', asyncHandler(async (req, res) => {
  const { alert_id } = req.params;
  
  const updateQuery = `
    UPDATE stock_alerts 
    SET status = 'ACKNOWLEDGED',
        acknowledged_by = $1,
        acknowledged_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;

  await dbAdapter.query(updateQuery, [req.user?.id, alert_id]);
  
  res.json({ message: 'Alert acknowledged successfully' });
}));

// Reports and Analytics
router.get('/reports/stock-summary', asyncHandler(async (req, res) => {
  const summaryQuery = `
    SELECT 
      mc.name as category_name,
      COUNT(im.id) as material_count,
      SUM(s.current_stock) as total_stock,
      SUM(s.reserved_stock) as total_reserved,
      SUM(s.stock_value) as total_value,
      COUNT(CASE WHEN s.available_stock <= im.minimum_stock_level THEN 1 END) as low_stock_count
    FROM material_categories mc
    LEFT JOIN inventory_materials im ON mc.id = im.category_id
    LEFT JOIN inventory_stock s ON im.id = s.inventory_material_id
    WHERE mc.is_active = true
    GROUP BY mc.id, mc.name
    ORDER BY total_value DESC
  `;

  const result = await dbAdapter.query(summaryQuery);
  
  res.json({ stock_summary: result.rows });
}));

router.get('/reports/movement-history', [
  query('days').optional().isInt({ min: 1, max: 365 }),
  query('material_id').optional().isUUID(),
  query('movement_type').optional().isIn(['IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE'])
], asyncHandler(async (req, res) => {
  const { days = 30, material_id, movement_type } = req.query;
  
  const conditions = [`sm.performed_at >= datetime('now', '-${days} days')`];
  const params = [];
  let paramCount = 0;

  if (material_id) {
    paramCount++;
    conditions.push(`im.id = $${paramCount}`);
    params.push(material_id);
  }

  if (movement_type) {
    paramCount++;
    conditions.push(`sm.movement_type = $${paramCount}`);
    params.push(movement_type);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const movementsQuery = `
    SELECT 
      sm.*,
      m.name as material_name,
      m.code as material_code,
      u.first_name || ' ' || u.last_name as performed_by_name
    FROM stock_movements sm
    JOIN inventory_stock s ON sm.inventory_stock_id = s.id
    JOIN inventory_materials im ON s.inventory_material_id = im.id
    JOIN materials m ON im.material_id = m.id
    JOIN users u ON sm.performed_by = u.id
    ${whereClause}
    ORDER BY sm.performed_at DESC
    LIMIT 500
  `;

  const result = await dbAdapter.query(movementsQuery, params);
  
  res.json({ movements: result.rows });
}));

export default router;