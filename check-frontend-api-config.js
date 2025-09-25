#!/usr/bin/env node

console.log('🔍 Checking Frontend API Configuration');
console.log('='.repeat(45));

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   VITE_API_BASE_URL: ${process.env.VITE_API_BASE_URL || 'NOT SET'}`);
console.log(`   VITE_API_URL: ${process.env.VITE_API_URL || 'NOT SET'}`);
console.log('');

// Check what the frontend should be using
const networkIP = 'localhost';
const expectedApiUrl = `http://${networkIP}:3001/api`;

console.log('🌐 Expected Configuration:');
console.log(`   VITE_API_BASE_URL should be: ${expectedApiUrl}`);
console.log(`   VITE_API_URL should be: http://${networkIP}:3001`);
console.log('');

console.log('💡 To fix this issue:');
console.log('   1. Stop the frontend server (Ctrl+C)');
console.log('   2. Run: $env:VITE_API_BASE_URL="http://localhost:3001/api"; $env:VITE_API_URL="http://localhost:3001"; npm run dev');
console.log('   3. Or use the network startup script: .\\start-network-server.ps1');
console.log('');

console.log('🧪 Testing API endpoints:');
console.log(`   Backend Health: http://${networkIP}:3001/health`);
console.log(`   API Base: ${expectedApiUrl}`);
console.log(`   Frontend: http://${networkIP}:8080`);
