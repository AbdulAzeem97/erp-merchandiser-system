#!/usr/bin/env node

import { networkInterfaces } from 'os';

console.log('🌐 Network Information for ERP Merchandiser System');
console.log('='.repeat(60));

const interfaces = networkInterfaces();
const localIPs = [];

console.log('📍 Available Network Interfaces:');
console.log('');

for (const [name, ifaces] of Object.entries(interfaces)) {
  console.log(`📡 ${name}:`);
  
  for (const iface of ifaces) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIPs.push(iface.address);
      console.log(`   ✅ ${iface.address} (${iface.mac})`);
    } else if (iface.family === 'IPv4' && iface.internal) {
      console.log(`   🔒 ${iface.address} (localhost)`);
    }
  }
  console.log('');
}

if (localIPs.length > 0) {
  const primaryIP = localIPs[0];
  console.log('🚀 Primary Network Access URLs:');
  console.log('='.repeat(60));
  console.log(`🎨 Frontend: http://${primaryIP}:8080`);
  console.log(`🔧 Backend:  http://${primaryIP}:3001`);
  console.log(`🏥 Health:   http://${primaryIP}:3001/health`);
  console.log('');
  console.log('👥 Share these URLs with your team members!');
  console.log('');
  console.log('💡 All available IPs for network access:');
  localIPs.forEach((ip, index) => {
    console.log(`   ${index + 1}. http://${ip}:8080`);
  });
} else {
  console.log('❌ No external network interfaces found');
  console.log('   Make sure you are connected to a network');
}

console.log('');
console.log('🔧 To start the network server, run:');
console.log('   • node start-network-server.js');
console.log('   • .\\start-network-server.ps1');
console.log('   • start-network.bat');
console.log('');
