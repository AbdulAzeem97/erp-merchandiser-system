import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
const router = express.Router();

// Database configuration
const dbConfig = {
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
};

const pool = new Pool(dbConfig);

// =====================================================
// SUPPLIERS ROUTES
// =====================================================

// Get all suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const { search, is_active } = req.query;
    
    let query = `
      SELECT * FROM suppliers 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (supplier_name ILIKE $${paramCount} OR supplier_code ILIKE $${paramCount} OR contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    query += ` ORDER BY supplier_name`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, suppliers: result.rows });
    
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single supplier
router.get('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM suppliers WHERE supplier_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    
    res.json({ success: true, supplier: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new supplier
router.post('/suppliers', async (req, res) => {
  try {
    const {
      supplier_code,
      supplier_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      tax_id,
      payment_terms,
      credit_limit,
      currency
    } = req.body;
    
    // Validate required fields
    if (!supplier_code || !supplier_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: supplier_code, supplier_name' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO suppliers (
        supplier_code, supplier_name, contact_person, email, phone, address,
        city, state, country, postal_code, tax_id, payment_terms, credit_limit, currency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      supplier_code, supplier_name, contact_person, email, phone, address,
      city, state, country, postal_code, tax_id, payment_terms, credit_limit, currency
    ]);
    
    res.status(201).json({ success: true, supplier: result.rows[0] });
    
  } catch (error) {
    console.error('Error creating supplier:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ success: false, error: 'Supplier code already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Update supplier
router.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updateFields)];
    
    const result = await pool.query(`
      UPDATE suppliers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE supplier_id = $1
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    
    res.json({ success: true, supplier: result.rows[0] });
    
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// PURCHASE REQUISITIONS ROUTES
// =====================================================

// Get all purchase requisitions
router.get('/requisitions', async (req, res) => {
  try {
    const { status, department, date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        pr.*,
        COUNT(pri.requisition_item_id) as item_count
      FROM purchase_requisitions pr
      LEFT JOIN purchase_requisition_items pri ON pr.requisition_id = pri.requisition_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND pr.status = $${paramCount}`;
      params.push(status);
    }
    
    if (department) {
      paramCount++;
      query += ` AND pr.department = $${paramCount}`;
      params.push(department);
    }
    
    if (date_from) {
      paramCount++;
      query += ` AND pr.requisition_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      query += ` AND pr.requisition_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    query += ` GROUP BY pr.requisition_id ORDER BY pr.requisition_date DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, requisitions: result.rows });
    
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single requisition with items
router.get('/requisitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get requisition details
    const requisitionResult = await pool.query(`
      SELECT * FROM purchase_requisitions WHERE requisition_id = $1
    `, [id]);
    
    if (requisitionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }
    
    // Get requisition items
    const itemsResult = await pool.query(`
      SELECT 
        pri.*,
        i.item_code,
        i.item_name,
        i.unit as item_unit
      FROM purchase_requisition_items pri
      LEFT JOIN inventory_items i ON pri.item_id = i.item_id
      WHERE pri.requisition_id = $1
    `, [id]);
    
    res.json({ 
      success: true, 
      requisition: requisitionResult.rows[0],
      items: itemsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new requisition
router.post('/requisitions', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      requisition_number,
      requested_by,
      department,
      requisition_date,
      required_date,
      priority,
      justification,
      items
    } = req.body;
    
    // Validate required fields
    if (!requisition_number || !requested_by || !department || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: requisition_number, requested_by, department, items' 
      });
    }
    
    // Calculate total estimated cost
    const totalEstimatedCost = items.reduce((sum, item) => {
      return sum + (item.estimated_unit_price * item.quantity);
    }, 0);
    
    // Insert requisition
    const requisitionResult = await client.query(`
      INSERT INTO purchase_requisitions (
        requisition_number, requested_by, department, requisition_date, 
        required_date, priority, total_estimated_cost, justification
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      requisition_number, requested_by, department, requisition_date,
      required_date, priority, totalEstimatedCost, justification
    ]);
    
    const requisitionId = requisitionResult.rows[0].requisition_id;
    
    // Insert requisition items
    for (const item of items) {
      await client.query(`
        INSERT INTO purchase_requisition_items (
          requisition_id, item_id, quantity, unit, estimated_unit_price,
          estimated_total_price, specifications, required_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        requisitionId, item.item_id, item.quantity, item.unit,
        item.estimated_unit_price, item.estimated_total_price,
        item.specifications, item.required_date
      ]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      requisition: requisitionResult.rows[0],
      message: 'Requisition created successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating requisition:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// PURCHASE ORDERS ROUTES
// =====================================================

// Get all purchase orders
router.get('/purchase-orders', async (req, res) => {
  try {
    const { status, supplier_id, date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        po.*,
        s.supplier_name,
        s.supplier_code,
        COUNT(poi.po_item_id) as item_count
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
      LEFT JOIN purchase_order_items poi ON po.po_id = poi.po_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND po.status = $${paramCount}`;
      params.push(status);
    }
    
    if (supplier_id) {
      paramCount++;
      query += ` AND po.supplier_id = $${paramCount}`;
      params.push(supplier_id);
    }
    
    if (date_from) {
      paramCount++;
      query += ` AND po.po_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      query += ` AND po.po_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    query += ` GROUP BY po.po_id, s.supplier_name, s.supplier_code ORDER BY po.po_date DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, purchase_orders: result.rows });
    
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single purchase order with items
router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get purchase order details
    const poResult = await pool.query(`
      SELECT 
        po.*,
        s.supplier_name,
        s.supplier_code,
        s.contact_person,
        s.email,
        s.phone,
        s.address,
        s.city,
        s.state,
        s.country,
        s.payment_terms
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
      WHERE po.po_id = $1
    `, [id]);
    
    if (poResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }
    
    // Get purchase order items
    const itemsResult = await pool.query(`
      SELECT 
        poi.*,
        i.item_code,
        i.item_name,
        i.unit as item_unit
      FROM purchase_order_items poi
      LEFT JOIN inventory_items i ON poi.item_id = i.item_id
      WHERE poi.po_id = $1
    `, [id]);
    
    res.json({ 
      success: true, 
      purchase_order: poResult.rows[0],
      items: itemsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new purchase order
router.post('/purchase-orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      po_number,
      supplier_id,
      requisition_id,
      po_date,
      expected_delivery_date,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      payment_terms,
      shipping_address,
      billing_address,
      notes,
      created_by,
      items
    } = req.body;
    
    // Validate required fields
    if (!po_number || !supplier_id || !items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: po_number, supplier_id, items' 
      });
    }
    
    // Insert purchase order
    const poResult = await client.query(`
      INSERT INTO purchase_orders (
        po_number, supplier_id, requisition_id, po_date, expected_delivery_date,
        subtotal, tax_amount, discount_amount, total_amount, currency,
        payment_terms, shipping_address, billing_address, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      po_number, supplier_id, requisition_id, po_date, expected_delivery_date,
      subtotal, tax_amount, discount_amount, total_amount, currency,
      payment_terms, shipping_address, billing_address, notes, created_by
    ]);
    
    const poId = poResult.rows[0].po_id;
    
    // Insert purchase order items
    for (const item of items) {
      await client.query(`
        INSERT INTO purchase_order_items (
          po_id, item_id, quantity_ordered, unit, unit_price,
          total_price, specifications, expected_delivery_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        poId, item.item_id, item.quantity_ordered, item.unit,
        item.unit_price, item.total_price, item.specifications, item.expected_delivery_date
      ]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      purchase_order: poResult.rows[0],
      message: 'Purchase order created successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase order:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// GOODS RECEIPT NOTES (GRN) ROUTES
// =====================================================

// Get all GRNs
router.get('/grns', async (req, res) => {
  try {
    const { status, supplier_id, date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        grn.*,
        s.supplier_name,
        s.supplier_code,
        po.po_number,
        l.location_name
      FROM goods_receipt_notes grn
      LEFT JOIN suppliers s ON grn.supplier_id = s.supplier_id
      LEFT JOIN purchase_orders po ON grn.po_id = po.po_id
      LEFT JOIN inventory_locations l ON grn.location_id = l.location_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND grn.status = $${paramCount}`;
      params.push(status);
    }
    
    if (supplier_id) {
      paramCount++;
      query += ` AND grn.supplier_id = $${paramCount}`;
      params.push(supplier_id);
    }
    
    if (date_from) {
      paramCount++;
      query += ` AND grn.grn_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      query += ` AND grn.grn_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    query += ` ORDER BY grn.grn_date DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, grns: result.rows });
    
  } catch (error) {
    console.error('Error fetching GRNs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

// Get procurement dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total suppliers count
    const suppliersResult = await pool.query(`
      SELECT COUNT(*) as total_suppliers FROM suppliers WHERE is_active = TRUE
    `);
    stats.total_suppliers = parseInt(suppliersResult.rows[0].total_suppliers);
    
    // Pending requisitions count
    const pendingReqResult = await pool.query(`
      SELECT COUNT(*) as pending_requisitions FROM purchase_requisitions WHERE status = 'SUBMITTED'
    `);
    stats.pending_requisitions = parseInt(pendingReqResult.rows[0].pending_requisitions);
    
    // Active purchase orders count
    const activePOResult = await pool.query(`
      SELECT COUNT(*) as active_pos FROM purchase_orders WHERE status IN ('SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED')
    `);
    stats.active_pos = parseInt(activePOResult.rows[0].active_pos);
    
    // Pending GRNs count
    const pendingGRNResult = await pool.query(`
      SELECT COUNT(*) as pending_grns FROM goods_receipt_notes WHERE status = 'DRAFT'
    `);
    stats.pending_grns = parseInt(pendingGRNResult.rows[0].pending_grns);
    
    // Total purchase value (last 30 days)
    const totalValueResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_purchase_value 
      FROM purchase_orders 
      WHERE po_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    stats.total_purchase_value = parseFloat(totalValueResult.rows[0].total_purchase_value);
    
    // Top suppliers by purchase value
    const topSuppliersResult = await pool.query(`
      SELECT 
        s.supplier_name,
        s.supplier_code,
        COUNT(po.po_id) as po_count,
        COALESCE(SUM(po.total_amount), 0) as total_value
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
      WHERE s.is_active = TRUE
      GROUP BY s.supplier_id, s.supplier_name, s.supplier_code
      ORDER BY total_value DESC
      LIMIT 5
    `);
    stats.top_suppliers = topSuppliersResult.rows;
    
    res.json({ success: true, stats });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
