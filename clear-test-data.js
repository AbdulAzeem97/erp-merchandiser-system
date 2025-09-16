import dbAdapter from './server/database/adapter.js';

async function clearTestData() {
  try {
    console.log('🧹 Clearing test data...');
    
    // Clear in reverse order of dependencies
    await dbAdapter.query('DELETE FROM job_lifecycle WHERE job_card_id LIKE $1', ['JC-%']);
    console.log('✅ Cleared job_lifecycle test data');
    
    await dbAdapter.query('DELETE FROM prepress_jobs WHERE job_card_id LIKE $1', ['JC-%']);
    console.log('✅ Cleared prepress_jobs test data');
    
    await dbAdapter.query('DELETE FROM job_cards WHERE job_card_id LIKE $1', ['JC-%']);
    console.log('✅ Cleared job_cards test data');
    
    await dbAdapter.query('DELETE FROM companies WHERE code = $1', ['TC001']);
    console.log('✅ Cleared companies test data');
    
    await dbAdapter.query('DELETE FROM products WHERE product_item_code = $1', ['TEST-PROD-001']);
    console.log('✅ Cleared products test data');
    
    await dbAdapter.query('DELETE FROM materials WHERE code = $1', ['TP-001']);
    console.log('✅ Cleared materials test data');
    
    await dbAdapter.query('DELETE FROM users WHERE username LIKE $1', ['testuser%']);
    await dbAdapter.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    console.log('✅ Cleared users test data');
    
    console.log('🎉 All test data cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing test data:', err.message);
    process.exit(1);
  }
}

clearTestData();