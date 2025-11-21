/**
 * Test the getJobDetails query
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function testJobDetails() {
  try {
    const jobId = 16; // Test with job ID 16
    
    console.log(`🧪 Testing getJobDetails for job ID: ${jobId}\n`);
    
    // Test the query from getJobDetails
    const jobQuery = `
      SELECT 
        pj.id as prepress_job_id,
        pj.job_card_id,
        jc."jobNumber" as job_card_number,
        jc.quantity,
        pj.priority,
        jc."dueDate" as delivery_date,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_item_code,
        NULL as product_type,
        COALESCE(p.brand, 'N/A') as material_name,
        NULL as product_material,
        c.name as company_name,
        jc.customer_name,
        jpp.planning_status,
        jpp.final_total_sheets,
        jpp.material_cost,
        jpp.selected_sheet_size_id,
        jpp.cutting_layout_type,
        jpp.grid_pattern,
        jpp.blanks_per_sheet,
        jpp.efficiency_percentage,
        jpp.scrap_percentage,
        jpp.base_required_sheets,
        jpp.additional_sheets,
        jpp.wastage_justification,
        jpp.planned_at,
        jpp.planned_by
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id
      WHERE pj.id = $1 AND COALESCE(pj.plate_generated, false) = true
    `;
    
    console.log('📝 Executing query...\n');
    const result = await pool.query(jobQuery, [jobId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Job not found or CTP not completed');
      // Check if job exists at all
      const checkJob = await pool.query('SELECT id, job_card_id, plate_generated FROM prepress_jobs WHERE id = $1', [jobId]);
      if (checkJob.rows.length > 0) {
        console.log('Job exists:', checkJob.rows[0]);
      }
    } else {
      console.log('✅ Query successful!');
      console.log('📋 Job details:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

testJobDetails();

