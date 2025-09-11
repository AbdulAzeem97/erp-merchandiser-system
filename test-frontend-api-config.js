#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🧪 Testing Frontend API Configuration');
console.log('='.repeat(45));

const interfaces = networkInterfaces();
let primaryIP = 'localhost';

for (const [name, ifaces] of Object.entries(interfaces)) {
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      primaryIP = iface.address;
      break;
    }
  }
  if (primaryIP !== 'localhost') break;
}

const apiUrl = `http://${primaryIP}:3001/api`;
const frontendUrl = `http://${primaryIP}:8080`;

console.log(`📍 Testing with IP: ${primaryIP}`);
console.log(`🔌 API URL: ${apiUrl}`);
console.log(`🎨 Frontend URL: ${frontendUrl}`);
console.log('');

async function testConfiguration() {
  try {
    // Test backend health
    console.log('🏥 Testing backend health...');
    const healthResponse = await fetch(`http://${primaryIP}:3001/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health check: PASSED');
      console.log(`   Status: ${healthData.status}`);
    } else {
      console.log('❌ Backend health check: FAILED');
      console.log(`   Status: ${healthResponse.status}`);
    }
    console.log('');

    // Test frontend access
    console.log('🎨 Testing frontend access...');
    const frontendResponse = await fetch(frontendUrl);
    if (frontendResponse.ok) {
      console.log('✅ Frontend access: PASSED');
      console.log(`   Status: ${frontendResponse.status}`);
    } else {
      console.log('❌ Frontend access: FAILED');
      console.log(`   Status: ${frontendResponse.status}`);
    }
    console.log('');

    // Test API endpoint
    console.log('🔌 Testing API endpoint...');
    const apiResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@horizonsourcing.com',
        password: 'password123'
      })
    });
    
    if (apiResponse.ok) {
      console.log('✅ API endpoint: PASSED');
      console.log(`   Status: ${apiResponse.status}`);
    } else {
      console.log('❌ API endpoint: FAILED');
      console.log(`   Status: ${apiResponse.status}`);
    }
    console.log('');

    console.log('📱 Network Access Summary:');
    console.log(`   • Frontend: ${frontendUrl}`);
    console.log(`   • Backend API: ${apiUrl}`);
    console.log(`   • Health Check: http://${primaryIP}:3001/health`);
    console.log('');
    console.log('👥 Team members can now access the system!');
    console.log('💡 Make sure to use the network URL, not localhost');

  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('💡 Make sure both servers are running:');
    console.log('   Backend: $env:JWT_SECRET="..."; $env:PORT=3001; node server/index.js');
    console.log('   Frontend: $env:VITE_API_BASE_URL="http://192.168.2.56:3001/api"; npm run dev');
  }
}

testConfiguration();
