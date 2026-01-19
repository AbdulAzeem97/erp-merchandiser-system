import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

async function testOffsetAPI() {
  try {
    // First login as Mr Nasir
    console.log('🔐 Logging in as Mr Nasir...\n');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nasir@horizonsourcing.net.pk',
        password: 'Password123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful\n');
    const token = loginData.token;

    // Check Offset Printing jobs
    console.log('📋 Checking Offset Printing jobs...\n');
    const jobsResponse = await fetch(`${API_BASE_URL}/offset-printing/jobs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const jobsData = await jobsResponse.json();
    
    if (jobsResponse.ok) {
      console.log(`✅ Found ${jobsData.count || 0} jobs in Offset Printing`);
      if (jobsData.jobs && jobsData.jobs.length > 0) {
        console.log('\n📊 Jobs:');
        jobsData.jobs.forEach(job => {
          console.log(`   - ${job.jobNumber}: ${job.product_name} (${job.offset_status || 'Pending'})`);
        });
      } else {
        console.log('   ℹ️  No jobs found');
      }
    } else {
      console.log('❌ Error:', jobsData.error || jobsData.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOffsetAPI();



