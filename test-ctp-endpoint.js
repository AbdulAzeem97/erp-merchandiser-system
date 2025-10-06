async function testCTPEndpoint() {
  try {
    console.log('🧪 Testing CTP endpoint...\n');
    
    // First login as admin to get token
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'adnanctp@horizonsourcing.net.pk',
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Logged in as:', loginData.user.email);
    console.log('   Role:', loginData.user.role);
    
    // Fetch CTP jobs
    const ctpResponse = await fetch('http://localhost:5001/api/ctp/jobs', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!ctpResponse.ok) {
      const error = await ctpResponse.text();
      console.error('❌ Failed to fetch CTP jobs:', error);
      return;
    }
    
    const ctpData = await ctpResponse.json();
    console.log(`\n✅ CTP Jobs fetched: ${ctpData.jobs.length} jobs\n`);
    
    ctpData.jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.job_card_number}`);
      console.log(`   Product: ${job.product_name}`);
      console.log(`   Customer: ${job.customer_name || job.company_name}`);
      console.log(`   Quantity: ${job.quantity}`);
      console.log(`   Designer: ${job.designer_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Plate Generated: ${job.plate_generated ? 'Yes' : 'No'}`);
      console.log(`   Plate Count: ${job.plate_count}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCTPEndpoint();

