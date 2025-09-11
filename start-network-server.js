#!/usr/bin/env node

import { spawn } from 'child_process';
import { networkInterfaces } from 'os';
import { createServer } from 'http';

console.log('🌐 Starting ERP Merchandiser System for Network Access...\n');

// Function to get local IP address
function getLocalIP() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Get local IP
const localIP = getLocalIP();
const backendPort = process.env.PORT || 3001;
const frontendPort = 8080;

console.log(`📍 Detected Local IP: ${localIP}`);
console.log(`🔧 Backend Port: ${backendPort}`);
console.log(`🎨 Frontend Port: ${frontendPort}\n`);

// Kill any existing processes
console.log('🔄 Stopping any existing processes...');
try {
  spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
  setTimeout(() => {
    startServers();
  }, 2000);
} catch (error) {
  console.log('No existing processes to stop');
  startServers();
}

function startServers() {
  console.log('📡 Starting Backend Server...');
  
  // Start backend server
  const backendProcess = spawn('node', ['server/index.js'], {
    env: {
      ...process.env,
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
      PORT: backendPort,
      NODE_ENV: 'development'
    },
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Backend] ${output.trim()}`);
    
    // Check if backend is ready
    if (output.includes('ERP Merchandiser Server running')) {
      console.log('✅ Backend server started successfully');
      startFrontend();
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  // Start frontend server
  function startFrontend() {
    console.log('🎨 Starting Frontend Server...');
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        VITE_API_BASE_URL: `http://${localIP}:${backendPort}/api`,
        VITE_API_URL: `http://${localIP}:${backendPort}`
      },
      stdio: 'pipe'
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Frontend] ${output.trim()}`);
      
      // Check if frontend is ready
      if (output.includes('Local:') || output.includes('Network:')) {
        console.log('✅ Frontend server started successfully');
        displayAccessInfo();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      console.error(`[Frontend Error] ${data.toString().trim()}`);
    });

    frontendProcess.on('close', (code) => {
      console.log(`Frontend process exited with code ${code}`);
    });
  }

  // Display access information
  function displayAccessInfo() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ERP MERCHANDISER SYSTEM - NETWORK ACCESS READY');
    console.log('='.repeat(80));
    console.log(`📍 Your Local IP: ${localIP}`);
    console.log(`🔧 Backend API: http://${localIP}:${backendPort}`);
    console.log(`🎨 Frontend App: http://${localIP}:${frontendPort}`);
    console.log(`🏥 Health Check: http://${localIP}:${backendPort}/health`);
    console.log('='.repeat(80));
    console.log('📱 Network Access URLs:');
    console.log(`   • Main Application: http://${localIP}:${frontendPort}`);
    console.log(`   • API Endpoint: http://${localIP}:${backendPort}/api`);
    console.log('='.repeat(80));
    console.log('👥 Share these URLs with your team members on the same network');
    console.log('🔒 Make sure Windows Firewall allows connections on these ports');
    console.log('='.repeat(80));
    console.log('\n💡 Tips:');
    console.log('   • Team members can access the system using your IP address');
    console.log('   • If connection fails, check Windows Firewall settings');
    console.log('   • Press Ctrl+C to stop both servers');
    console.log('\n🔄 System is running... Press Ctrl+C to stop\n');
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill('SIGTERM');
    if (typeof frontendProcess !== 'undefined') {
      frontendProcess.kill('SIGTERM');
    }
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill('SIGTERM');
    if (typeof frontendProcess !== 'undefined') {
      frontendProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
}
