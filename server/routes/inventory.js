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
// INVENTORY ITEMS ROUTES
// =====================================================

// Get all inventory items with category and balance info
router.get('/items', async (req, res) => {
  try {
    const { category_id, location_id, search, is_active } = req.query;
    
    let query = `
      SELECT 
        i.item_id,
        i.item_code,
        i.item_name,
        i.unit,
        i.reorder_level,
        i.reorder_qty,
        i.unit_cost,
        i.is_active,
        i.created_at,
        i.updated_at,
        c.department,
        c.master_category,
        c.control_category,
        COALESCE(ib.balance_qty, 0) as balance_qty,
        COALESCE(ib.total_value, 0) as total_value,
        l.location_name
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.category_id
      LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
      LEFT JOIN inventory_locations l ON ib.location_id = l.location_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category_id) {
      paramCount++;
      query += ` AND i.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (location_id) {
      paramCount++;
      query += ` AND ib.location_id = $${paramCount}`;
      params.push(location_id);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (i.item_code ILIKE $${paramCount} OR i.item_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND i.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    query += ` ORDER BY i.item_code`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, items: result.rows });
    
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single inventory item
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        i.*,
        c.department,
        c.master_category,
        c.control_category,
        COALESCE(ib.balance_qty, 0) as balance_qty,
        COALESCE(ib.total_value, 0) as total_value,
        l.location_name
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.category_id
      LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
      LEFT JOIN inventory_locations l ON ib.location_id = l.location_id
      WHERE i.item_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, item: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new inventory item
router.post('/items', async (req, res) => {
  try {
    const {
      item_code,
      item_name,
      unit,
      category_id,
      reorder_level = 0,
      reorder_qty = 0,
      unit_cost = 0
    } = req.body;
    
    // Validate required fields
    if (!item_code || !item_name || !unit || !category_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: item_code, item_name, unit, category_id' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost]);
    
    res.status(201).json({ success: true, item: result.rows[0] });
    
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ success: false, error: 'Item code already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_code,
      item_name,
      unit,
      category_id,
      reorder_level,
      reorder_qty,
      unit_cost,
      is_active
    } = req.body;
    
    const result = await pool.query(`
      UPDATE inventory_items 
      SET 
        item_code = COALESCE($2, item_code),
        item_name = COALESCE($3, item_name),
        unit = COALESCE($4, unit),
        category_id = COALESCE($5, category_id),
        reorder_level = COALESCE($6, reorder_level),
        reorder_qty = COALESCE($7, reorder_qty),
        unit_cost = COALESCE($8, unit_cost),
        is_active = COALESCE($9, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE item_id = $1
      RETURNING *
    `, [id, item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost, is_active]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, item: result.rows[0] });
    
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// INVENTORY TRANSACTIONS ROUTES
// =====================================================

// Get inventory transactions
router.get('/transactions', async (req, res) => {
  try {
    const { item_id, location_id, txn_type, date_from, date_to, ref_no, job_card_no } = req.query;
    
    let query = `
      SELECT 
        t.*,
        i.item_code,
        i.item_name,
        i.unit as item_unit,
        l.location_name,
        c.department,
        c.master_category,
        c.control_category
      FROM inventory_transactions t
      LEFT JOIN inventory_items i ON t.item_id = i.item_id
      LEFT JOIN inventory_locations l ON t.location_id = l.location_id
      LEFT JOIN inventory_categories c ON i.category_id = c.category_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (item_id) {
      paramCount++;
      query += ` AND t.item_id = $${paramCount}`;
      params.push(item_id);
    }
    
    if (location_id) {
      paramCount++;
      query += ` AND t.location_id = $${paramCount}`;
      params.push(location_id);
    }
    
    if (txn_type) {
      paramCount++;
      query += ` AND t.txn_type = $${paramCount}`;
      params.push(txn_type);
    }
    
    if (date_from) {
      paramCount++;
      query += ` AND t.txn_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      query += ` AND t.txn_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    if (ref_no) {
      paramCount++;
      query += ` AND t.ref_no ILIKE $${paramCount}`;
      params.push(`%${ref_no}%`);
    }
    
    if (job_card_no) {
      paramCount++;
      query += ` AND t.job_card_no ILIKE $${paramCount}`;
      params.push(`%${job_card_no}%`);
    }
    
    query += ` ORDER BY t.txn_date DESC, t.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, transactions: result.rows });
    
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create inventory transaction
router.post('/transactions', async (req, res) => {
  try {
    const {
      item_id,
      location_id,
      txn_type,
      txn_date,
      qty,
      unit,
      ref_no,
      department,
      job_card_no,
      remarks,
      unit_cost = 0,
      created_by
    } = req.body;
    
    // Validate required fields
    if (!item_id || !location_id || !txn_type || !txn_date || !qty || !unit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: item_id, location_id, txn_type, txn_date, qty, unit' 
      });
    }
    
    const total_value = qty * unit_cost;
    
    const result = await pool.query(`
      INSERT INTO inventory_transactions (
        item_id, location_id, txn_type, txn_date, qty, unit, 
        ref_no, department, job_card_no, remarks, unit_cost, total_value, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      item_id, location_id, txn_type, txn_date, qty, unit,
      ref_no, department, job_card_no, remarks, unit_cost, total_value, created_by
    ]);
    
    res.status(201).json({ success: true, transaction: result.rows[0] });
    
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// INVENTORY CATEGORIES ROUTES
// =====================================================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM inventory_categories 
      WHERE is_active = TRUE 
      ORDER BY department, master_category, control_category
    `);
    
    res.json({ success: true, categories: result.rows });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const { department, master_category, control_category, description } = req.body;
    
    if (!department || !master_category || !control_category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: department, master_category, control_category' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO inventory_categories (department, master_category, control_category, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [department, master_category, control_category, description]);
    
    res.status(201).json({ success: true, category: result.rows[0] });
    
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ success: false, error: 'Category combination already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// =====================================================
// INVENTORY LOCATIONS ROUTES
// =====================================================

// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM inventory_locations 
      WHERE is_active = TRUE 
      ORDER BY location_name
    `);
    
    res.json({ success: true, locations: result.rows });
    
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// INVENTORY REPORTS ROUTES
// =====================================================

// Item-wise consolidated report
router.get('/reports/item-wise', async (req, res) => {
  try {
    const { department, master_category, control_category, location_id } = req.query;
    
    let query = `
      SELECT * FROM v_item_wise_consolidated 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }
    
    if (master_category) {
      paramCount++;
      query += ` AND master_category = $${paramCount}`;
      params.push(master_category);
    }
    
    if (control_category) {
      paramCount++;
      query += ` AND control_category = $${paramCount}`;
      params.push(control_category);
    }
    
    if (location_id) {
      paramCount++;
      query += ` AND location_id = $${paramCount}`;
      params.push(location_id);
    }
    
    query += ` ORDER BY department, master_category, control_category, item_code`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, report: result.rows });
    
  } catch (error) {
    console.error('Error generating item-wise report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Category-wise summary report
router.get('/reports/category-wise', async (req, res) => {
  try {
    const { department } = req.query;
    
    let query = `SELECT * FROM v_category_wise_summary WHERE 1=1`;
    const params = [];
    
    if (department) {
      query += ` AND department = $1`;
      params.push(department);
    }
    
    query += ` ORDER BY department, master_category, control_category`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, report: result.rows });
    
  } catch (error) {
    console.error('Error generating category-wise report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reorder alerts report
router.get('/reports/reorder-alerts', async (req, res) => {
  try {
    const { stock_status } = req.query;
    
    let query = `SELECT * FROM v_reorder_alerts WHERE 1=1`;
    const params = [];
    
    if (stock_status) {
      query += ` AND stock_status = $1`;
      params.push(stock_status);
    }
    
    query += ` ORDER BY stock_status, department, master_category, control_category`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, report: result.rows });
    
  } catch (error) {
    console.error('Error generating reorder alerts report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Item ledger report (detailed transaction history)
router.get('/reports/item-ledger/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const { date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        t.txn_date,
        t.txn_type,
        t.ref_no,
        t.qty,
        t.unit,
        t.department,
        t.job_card_no,
        t.remarks,
        t.unit_cost,
        t.total_value,
        t.created_by,
        t.created_at,
        l.location_name
      FROM inventory_transactions t
      LEFT JOIN inventory_locations l ON t.location_id = l.location_id
      WHERE t.item_id = $1
    `;
    
    const params = [item_id];
    let paramCount = 1;
    
    if (date_from) {
      paramCount++;
      query += ` AND t.txn_date >= $${paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      query += ` AND t.txn_date <= $${paramCount}`;
      params.push(date_to);
    }
    
    query += ` ORDER BY t.txn_date DESC, t.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, report: result.rows });
    
  } catch (error) {
    console.error('Error generating item ledger report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

// Get inventory dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total items count
    const itemsResult = await pool.query(`
      SELECT COUNT(*) as total_items FROM inventory_items WHERE is_active = TRUE
    `);
    stats.total_items = parseInt(itemsResult.rows[0].total_items);
    
    // Total stock value
    const valueResult = await pool.query(`
      SELECT SUM(total_value) as total_value FROM inventory_balances
    `);
    stats.total_value = parseFloat(valueResult.rows[0].total_value || 0);
    
    // Items with low stock
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) as low_stock_count FROM v_reorder_alerts WHERE stock_status IN ('REORDER_REQUIRED', 'LOW_STOCK')
    `);
    stats.low_stock_count = parseInt(lowStockResult.rows[0].low_stock_count);
    
    // Recent transactions count (last 7 days)
    const recentTxnResult = await pool.query(`
      SELECT COUNT(*) as recent_transactions 
      FROM inventory_transactions 
      WHERE txn_date >= CURRENT_DATE - INTERVAL '7 days'
    `);
    stats.recent_transactions = parseInt(recentTxnResult.rows[0].recent_transactions);
    
    // Top categories by value
    const topCategoriesResult = await pool.query(`
      SELECT 
        department,
        master_category,
        control_category,
        SUM(total_value) as category_value
      FROM v_category_wise_summary
      GROUP BY department, master_category, control_category
      ORDER BY category_value DESC
      LIMIT 5
    `);
    stats.top_categories = topCategoriesResult.rows;
    
    res.json({ success: true, stats });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;