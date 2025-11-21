/**
 * Test getJobPlanning directly
 */

import dbAdapter from './server/database/adapter.js';

async function testGetJobPlanning() {
  try {
    // Set environment variables
    process.env.DB_USER = 'erp_user';
    process.env.DB_PASSWORD = 'DevPassword123!';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'erp_merchandiser';
    process.env.DB_PORT = '5432';
    
    await dbAdapter.initialize();
    console.log('✅ Database initialized\n');
    
    const jobCardId = 78;
    console.log(`🧪 Testing getJobPlanning for job_card_id: ${jobCardId}\n`);
    
    const result = await dbAdapter.query(
      `SELECT * FROM job_production_planning 
       WHERE job_card_id = $1`,
      [jobCardId]
    );
    
    console.log(`✅ Query successful! Found ${result.rows.length} planning records\n`);
    
    if (result.rows.length > 0) {
      console.log('📋 Planning data:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('ℹ️  No planning found (this is OK for new jobs)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testGetJobPlanning();

