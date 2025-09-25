import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Complete ERP Merchandiser System...\n');

// Function to start backend server
function startBackend() {
  console.log('📡 Starting Backend Server...');
  
  const backendProcess = spawn('node', ['server/index.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
      PORT: '3001'
    },
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server running on port 3001')) {
      console.log('✅ Backend server started successfully on port 3001');
      startFrontend();
    }
    if (output.includes('Connected to SQLite database')) {
      console.log('✅ Database connected successfully');
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (error.includes('EADDRINUSE')) {
      console.log('⚠️  Port 3001 is already in use. Backend might already be running.');
      startFrontend();
    } else {
      console.log('Backend Error:', error);
    }
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  return backendProcess;
}

// Function to start frontend server
function startFrontend() {
  console.log('🎨 Starting Frontend Server...');
  
  // Use PowerShell to run npm since it's a .ps1 script
  const frontendProcess = spawn('powershell', ['-Command', 'npm run dev'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:')) {
      const match = output.match(/Local:\s+(http:\/\/localhost:\d+)/);
      if (match) {
        console.log(`✅ Frontend server started at: ${match[1]}`);
        console.log('\n🎉 Complete System Started Successfully!');
        console.log('\n📋 System Information:');
        console.log('   Backend:  http://localhost:3001');
        console.log('   Frontend: ' + match[1]);
        console.log('   Database: SQLite (erp_merchandiser.db)');
        console.log('\n🔑 Login Credentials:');
        console.log('   Admin: admin@erp.local / admin123');
        console.log('   Designer: emma.wilson@horizonsourcing.com / admin123');
        console.log('   Merchandiser: tom.anderson@horizonsourcing.com / admin123');
        console.log('   Inventory: inventory@horizonsourcing.com / admin123');
        console.log('\n🌐 Module Access:');
        console.log('   Dashboard: ' + match[1] + '/');
        console.log('   Prepress: ' + match[1] + '/prepress');
        console.log('   Inventory: ' + match[1] + '/inventory');
        console.log('   Production: ' + match[1] + '/production');
        console.log('\n✨ System is ready for use!');
      }
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Download the React DevTools')) {
      console.log('Frontend Error:', error);
    }
  });

  frontendProcess.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });

  return frontendProcess;
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down complete system...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down complete system...');
  process.exit(0);
});

// Start the system
startBackend();
