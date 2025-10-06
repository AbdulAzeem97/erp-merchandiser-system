import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get item specifications for a specific job
router.get('/jobs/:jobId/item-specifications', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const query = `
      SELECT 
        isp.*,
        jc."jobNumber",
        p.name as product_name,
        c.name as company_name
      FROM item_specifications isp
      LEFT JOIN job_cards jc ON isp.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      WHERE isp.job_card_id = $1
      ORDER BY isp.uploaded_at DESC
    `;
    
    const result = await req.db.query(query, [jobId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No item specifications found for this job'
      });
    }
    
    res.json({
      success: true,
      itemSpecifications: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching item specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item specifications',
      error: error.message
    });
  }
});

// Save item specifications for a job
router.post('/jobs/:jobId/item-specifications', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      excel_file_link,
      excel_file_name,
      po_number,
      job_number,
      brand_name,
      item_name,
      uploaded_at,
      item_count,
      total_quantity,
      size_variants,
      color_variants,
      specifications,
      raw_excel_data
    } = req.body;
    
    // Check if item specifications already exist for this job
    const existingQuery = 'SELECT id FROM item_specifications WHERE job_card_id = $1';
    const existingResult = await req.db.query(existingQuery, [jobId]);
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE item_specifications SET
          excel_file_link = $2,
          excel_file_name = $3,
          po_number = $4,
          job_number = $5,
          brand_name = $6,
          item_name = $7,
          uploaded_at = $8,
          item_count = $9,
          total_quantity = $10,
          size_variants = $11,
          color_variants = $12,
          specifications = $13,
          raw_excel_data = $14,
          updated_at = NOW()
        WHERE job_card_id = $1
        RETURNING *
      `;
      
      result = await req.db.query(updateQuery, [
        jobId,
        excel_file_link,
        excel_file_name,
        po_number,
        job_number,
        brand_name,
        item_name,
        uploaded_at,
        item_count,
        total_quantity,
        size_variants,
        color_variants,
        JSON.stringify(specifications),
        JSON.stringify(raw_excel_data)
      ]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO item_specifications (
          job_card_id,
          excel_file_link,
          excel_file_name,
          po_number,
          job_number,
          brand_name,
          item_name,
          uploaded_at,
          item_count,
          total_quantity,
          size_variants,
          color_variants,
          specifications,
          raw_excel_data,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      result = await req.db.query(insertQuery, [
        jobId,
        excel_file_link,
        excel_file_name,
        po_number,
        job_number,
        brand_name,
        item_name,
        uploaded_at,
        item_count,
        total_quantity,
        size_variants,
        color_variants,
        JSON.stringify(specifications),
        JSON.stringify(raw_excel_data),
        req.user.id
      ]);
    }
    
    res.json({
      success: true,
      message: 'Item specifications saved successfully',
      itemSpecifications: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error saving item specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save item specifications',
      error: error.message
    });
  }
});

// Get all item specifications (for admin/reporting)
router.get('/item-specifications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, jobId, poNumber } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;
    
    if (jobId) {
      paramCount++;
      whereClause += ` WHERE isp.job_card_id = $${paramCount}`;
      queryParams.push(jobId);
    }
    
    if (poNumber) {
      paramCount++;
      whereClause += paramCount === 1 ? ' WHERE' : ' AND';
      whereClause += ` isp.po_number ILIKE $${paramCount}`;
      queryParams.push(`%${poNumber}%`);
    }
    
    const query = `
      SELECT 
        isp.*,
        jc."jobNumber",
        p.name as product_name,
        c.name as company_name,
        u."firstName" || ' ' || u."lastName" as created_by_name
      FROM item_specifications isp
      LEFT JOIN job_cards jc ON isp.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN users u ON isp.created_by = u.id
      ${whereClause}
      ORDER BY isp.uploaded_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    
    const result = await req.db.query(query, queryParams);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM item_specifications isp
      ${whereClause}
    `;
    const countResult = await req.db.query(countQuery, queryParams.slice(0, -2));
    
    res.json({
      success: true,
      itemSpecifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching item specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item specifications',
      error: error.message
    });
  }
});

export default router;
