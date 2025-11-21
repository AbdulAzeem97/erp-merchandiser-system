/**
 * Test the job details endpoint to verify material_id lookup
 */

import fetch from 'node-fetch';

async function testJobDetails() {
  try {
    const jobIds = [16, 23]; // PULL & BEAR and AHLENS jobs
    
    console.log('🧪 Testing job details endpoint for material_id lookup...\n');
    
    for (const jobId of jobIds) {
      console.log(`\n📋 Testing job ID: ${jobId}`);
      
      const response = await fetch(
        `http://localhost:5001/api/production/smart-dashboard/jobs/${jobId}`,
        {
          headers: {
            'Authorization': 'Bearer test-token' // You may need a real token
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          console.log(`  Material Name: ${data.job.product.material_name}`);
          console.log(`  Material ID: ${data.job.material_id || 'NULL'}`);
          if (data.job.material_id) {
            console.log(`  ✅ Material ID found!`);
          } else {
            console.log(`  ❌ Material ID is NULL`);
          }
        }
      } else {
        console.log(`  ❌ Request failed: ${response.status}`);
        const errorText = await response.text();
        console.log(`  Error: ${errorText.substring(0, 200)}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Backend server is not running. Please start it with: npm run server');
    }
    process.exit(1);
  }
}

testJobDetails();

