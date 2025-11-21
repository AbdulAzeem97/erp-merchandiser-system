/**
 * Test the Smart Production Dashboard query
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function testQuery() {
  try {
    console.log('🧪 Testing Smart Production Dashboard query...\n');
    
    // Check if job_production_planning table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_production_planning'
      )
    `);
    const hasPlanningTable = tableCheck.rows[0].exists;
    console.log(`📋 job_production_planning exists: ${hasPlanningTable}\n`);

    const query = `
      SELECT 
        pj.id as prepress_job_id,
        pj.job_card_id,
        jc."jobNumber" as job_card_number,
        COALESCE(p.name, 'N/A') as product_name,
        COALESCE(p.sku, 'N/A') as product_item_code,
        NULL as product_type,
        jc.customer_name,
        COALESCE(c.name, 'N/A') as company_name,
        jc.quantity,
        pj.priority,
        jc."dueDate" as delivery_date,
        pj.status as prepress_status,
        COALESCE(pj.plate_generated, false) as plate_generated,
        pj.plate_generated_at,
        pj.created_at,
        COALESCE(p.brand, 'N/A') as material_name,
        NULL as product_material
        ${hasPlanningTable ? `,
        jpp.planning_status,
        jpp.final_total_sheets,
        jpp.material_cost` : `,
        NULL as planning_status,
        NULL as final_total_sheets,
        NULL as material_cost`}
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      ${hasPlanningTable ? 'LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id' : ''}
      WHERE COALESCE(pj.plate_generated, false) = true
      ORDER BY 
        ${hasPlanningTable ? `
        CASE 
          WHEN jpp.planning_status = 'APPLIED' THEN 3
          WHEN jpp.planning_status = 'LOCKED' THEN 2
          WHEN jpp.planning_status = 'PLANNED' THEN 1
          ELSE 0
        END,
        ` : ''}
        pj.priority DESC NULLS LAST,
        pj.plate_generated_at DESC NULLS LAST
    `;

    console.log('📝 Executing query...\n');
    const result = await pool.query(query);
    
    console.log(`✅ Query successful! Found ${result.rows.length} jobs\n`);
    
    if (result.rows.length > 0) {
      console.log('📋 Sample job:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('ℹ️  No jobs found with plate_generated = true');
      console.log('\nChecking prepress_jobs table...');
      const allJobs = await pool.query('SELECT id, job_card_id, plate_generated FROM prepress_jobs LIMIT 5');
      console.log('Sample prepress_jobs:');
      allJobs.rows.forEach(job => {
        console.log(`  - ID: ${job.id}, Job Card: ${job.job_card_id}, Plate Generated: ${job.plate_generated}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

testQuery();

