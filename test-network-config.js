#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🌐 Testing Network Configuration for ERP System');
console.log('='.repeat(60));

const interfaces = networkInterfaces();
const localIPs = [];

for (const [name, ifaces] of Object.entries(interfaces)) {
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIPs.push(iface.address);
    }
  }
}

if (localIPs.length > 0) {
  const primaryIP = localIPs[0];
  
  console.log('✅ Network Configuration:');
  console.log(`📍 Primary IP: ${primaryIP}`);
  console.log(`🔧 Backend URL: http://${primaryIP}:3001`);
  console.log(`🎨 Frontend URL: http://${primaryIP}:8080`);
  console.log(`🔌 API Endpoint: http://${primaryIP}:3001/api`);
  console.log('');
  
  console.log('🧪 Testing API Endpoints:');
  
  // Test backend health
  try {
    const response = await fetch(`http://${primaryIP}:3001/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend Health Check: PASSED');
      console.log(`   Status: ${data.status}`);
      console.log(`   Environment: ${data.environment}`);
    } else {
      console.log('❌ Backend Health Check: FAILED');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend Health Check: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  // Test frontend
  try {
    const response = await fetch(`http://${primaryIP}:8080`);
    if (response.ok) {
      console.log('✅ Frontend Access: PASSED');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log('❌ Frontend Access: FAILED');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Frontend Access: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
  console.log('📱 Network Access URLs for Team Members:');
  console.log(`   • Main Application: http://${primaryIP}:8080`);
  console.log(`   • API Endpoint: http://${primaryIP}:3001/api`);
  console.log(`   • Health Check: http://${primaryIP}:3001/health`);
  console.log('');
  console.log('💡 Make sure Windows Firewall allows connections on ports 3001 and 8080');
  
} else {
  console.log('❌ No external network interfaces found');
  console.log('   Make sure you are connected to a network');
}

console.log('');
