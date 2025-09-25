#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🔐 Testing Correct Login Credentials');
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

console.log(`📍 Testing with IP: ${primaryIP}`);
console.log(`🔌 API URL: ${apiUrl}`);
console.log('');

// Test multiple user credentials
const testUsers = [
  { email: 'emma.wilson@horizonsourcing.com', password: 'password123', name: 'Emma Wilson (Designer)' },
  { email: 'admin@erp.local', password: 'password123', name: 'System Administrator' },
  { email: 'inventory@horizonsourcing.com', password: 'password123', name: 'Inventory Manager' },
  { email: 'hodprepress@horizonsourcing.com', password: 'password123', name: 'Sarah Johnson (HOD Prepress)' }
];

async function testUserLogin(user) {
  try {
    console.log(`🧪 Testing ${user.name}...`);
    
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${user.name}: LOGIN SUCCESS`);
      console.log(`   User: ${data.user.first_name} ${data.user.last_name}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Token: ${data.token ? 'Present' : 'Missing'}`);
      return { success: true, user: data.user, token: data.token };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ ${user.name}: LOGIN FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
      return { success: false, error: errorData.error };
    }
  } catch (error) {
    console.log(`❌ ${user.name}: LOGIN FAILED`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test all users
let successfulLogins = 0;
for (const user of testUsers) {
  const result = await testUserLogin(user);
  if (result.success) {
    successfulLogins++;
  }
  console.log('');
}

console.log('📊 Login Test Summary:');
console.log(`   Successful logins: ${successfulLogins}/${testUsers.length}`);
console.log('');
console.log('📱 Network Access URLs:');
console.log(`   • Frontend: http://${primaryIP}:8080`);
console.log(`   • Backend API: ${apiUrl}`);
console.log('');
console.log('👥 Team members can now access the system!');
console.log('💡 Use any of the successful login credentials above');
