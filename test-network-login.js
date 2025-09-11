#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🔐 Testing Network Login Functionality');
console.log('='.repeat(50));

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

console.log(`📍 Testing with IP: ${primaryIP}`);
console.log(`🔌 API URL: ${apiUrl}`);
console.log('');

// Test login endpoint
async function testLogin() {
  try {
    console.log('🧪 Testing Login Endpoint...');
    
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'emma.wilson@horizonsourcing.com',
        password: 'password123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login Test: PASSED');
      console.log(`   User: ${data.user.first_name} ${data.user.last_name}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Token: ${data.token ? 'Present' : 'Missing'}`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Login Test: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Login Test: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Test designer jobs endpoint
async function testDesignerJobs() {
  try {
    console.log('🧪 Testing Designer Jobs Endpoint...');
    
    // First login to get token
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'emma.wilson@horizonsourcing.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Designer Jobs Test: FAILED (Login failed)');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Now test designer jobs endpoint
    const jobsResponse = await fetch(`${apiUrl}/job-assignment/designer/${loginData.user.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log('✅ Designer Jobs Test: PASSED');
      console.log(`   Jobs found: ${jobsData.jobs ? jobsData.jobs.length : 0}`);
    } else {
      const errorData = await jobsResponse.json().catch(() => ({}));
      console.log('❌ Designer Jobs Test: FAILED');
      console.log(`   Status: ${jobsResponse.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Designer Jobs Test: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

// Run tests
await testLogin();
console.log('');
await testDesignerJobs();

console.log('');
console.log('📱 Network Access Summary:');
console.log(`   • Frontend: http://${primaryIP}:8080`);
console.log(`   • Backend API: ${apiUrl}`);
console.log(`   • Health Check: http://${primaryIP}:3001/health`);
console.log('');
console.log('👥 Team members can now access the system using these URLs!');
