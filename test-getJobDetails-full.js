/**
 * Test the full getJobDetails query with actual database
 */

import dbAdapter from './server/database/adapter.js';

async function testGetJobDetails() {
  try {
    await dbAdapter.initialize();
    console.log('✅ Database initialized\n');
    
    const jobId = 16;
    console.log(`🧪 Testing getJobDetails for job ID: ${jobId}\n`);
    
    // Check if planning table exists
    const tableCheck = await dbAdapter.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_production_planning'
      )
    `);
    const hasPlanningTable = tableCheck.rows[0].exists;
    console.log('✅ Planning table exists:', hasPlanningTable);
    
    // Build the exact query from controller
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
        jc.customer_name
        ${hasPlanningTable ? `,
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
        jpp.planned_by` : ''}
      FROM prepress_jobs pj
      INNER JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      LEFT JOIN companies c ON jc."companyId" = c.id
      ${hasPlanningTable ? 'LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id' : ''}
      WHERE pj.id = $1 AND COALESCE(pj.plate_generated, false) = true
    `;
    
    console.log('\n📝 Executing query...');
    console.log('Query:', jobQuery.replace(/\s+/g, ' ').trim());
    console.log('Parameters:', [jobId]);
    
    const jobResult = await dbAdapter.query(jobQuery, [jobId]);
    
    console.log(`\n✅ Query successful! Found ${jobResult.rows.length} rows\n`);
    
    if (jobResult.rows.length > 0) {
      console.log('📋 Job data:');
      console.log(JSON.stringify(jobResult.rows[0], null, 2));
    } else {
      console.log('ℹ️  No job found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error position:', error.position);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testGetJobDetails();

