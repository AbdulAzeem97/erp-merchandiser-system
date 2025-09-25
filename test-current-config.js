#!/usr/bin/env node

console.log('🔍 Testing Current Server Configuration');
console.log('='.repeat(50));

async function testCurrentConfig() {
  try {
    // Test backend health
    console.log('🏥 Testing backend health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health: PASSED');
      console.log(`   Status: ${healthData.status}`);
    } else {
      console.log('❌ Backend health: FAILED');
      console.log(`   Status: ${healthResponse.status}`);
    }
    console.log('');

    // Test frontend access
    console.log('🎨 Testing frontend access...');
    const frontendResponse = await fetch('http://localhost:8080');
    if (frontendResponse.ok) {
      console.log('✅ Frontend access: PASSED');
      console.log(`   Status: ${frontendResponse.status}`);
    } else {
      console.log('❌ Frontend access: FAILED');
      console.log(`   Status: ${frontendResponse.status}`);
    }
    console.log('');

    // Test login API directly
    console.log('🔐 Testing login API...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@erp.local',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login API: PASSED');
      console.log(`   User: ${loginData.user.first_name} ${loginData.user.last_name}`);
      console.log(`   Role: ${loginData.user.role}`);
      console.log(`   Token: ${loginData.token ? 'EXISTS' : 'MISSING'}`);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login API: FAILED');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }
    console.log('');

    // Test if frontend is actually using the network API
    console.log('🌐 Testing if frontend uses network API...');
    try {
      const frontendHtml = await fetch('http://localhost:8080');
      const htmlText = await frontendHtml.text();
      
      if (htmlText.includes('localhost')) {
        console.log('✅ Frontend is using network API URL');
      } else if (htmlText.includes('localhost')) {
        console.log('❌ Frontend is still using localhost');
      } else {
        console.log('⚠️ Cannot determine frontend API configuration');
      }
    } catch (error) {
      console.log('❌ Cannot test frontend configuration:', error.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testCurrentConfig();



