#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏭 Starting Complete Production System...\n');

// Check if required files exist
const requiredFiles = [
  'server/database/complete-production-schema.sql',
  'server/database/complete-production-seed.sql'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.log(`❌ Required file not found: ${file}`);
    console.log('Please ensure all production system files are in place.');
    process.exit(1);
  }
}

// Step 1: Setup database
console.log('📊 Setting up production database...');
try {
  // Run database migration
  const migrateProcess = spawn('node', ['server/database/migrate.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  migrateProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Database migration completed');
      startServers();
    } else {
      console.log('❌ Database migration failed');
      process.exit(1);
    }
  });

} catch (error) {
  console.log('❌ Error setting up database:', error.message);
  process.exit(1);
}

function startServers() {
  console.log('\n🚀 Starting servers...\n');

  // Start backend server
  console.log('🔧 Starting backend server on port 3001...');
  const backend = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: '3001',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production'
    }
  });

  // Wait a bit for backend to start
  setTimeout(() => {
    // Start frontend server
    console.log('📱 Starting frontend server on port 8080...');
    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });

    // Display system information
    setTimeout(() => {
      console.log(`
🎉 Complete Production System is running!

📱 Frontend: http://localhost:8080
🔧 Backend: http://localhost:3001
🏭 Production System: http://localhost:8080/production

Available Demo Users:
👑 Director: director / director123
👨‍💼 HOD Accounts: 
   - Offset HOD: offset_hod / offset123
   - Heat Press HOD: heat_hod / heat123
   - Prepress HOD: prepress_hod / prep123
   - Digital HOD: digital_hod / digital123
   - Finishing HOD: finishing_hod / finishing123

👥 Supervisor Accounts:
   - Offset Supervisor: offset_sup / sup123
   - Heat Press Supervisor: heat_sup / sup123
   - Prepress Supervisor: prepress_sup / prep123
   - Digital Supervisor: digital_sup / sup123
   - Finishing Supervisor: finishing_sup / sup123

🔧 Operator Accounts:
   - Offset Operator: offset_op / op123
   - Heat Press Operator: heat_op / op123
   - Prepress Operator: prepress_op / op123
   - Digital Operator: digital_op / dop123
   - Finishing Operator: finishing_op / op123

🔍 Quality Control: quality_qc / qc123

Key Features:
✅ Complete department hierarchy with color-coded visualization
✅ Advanced workflow management with step-by-step tracking
✅ Real-time job status updates and progression
✅ Quality control integration with approval/rejection workflow
✅ Material consumption tracking and inventory integration
✅ Equipment monitoring and maintenance scheduling
✅ Comprehensive reporting and analytics dashboard
✅ Alert system for critical issues
✅ Mobile-responsive design

Press Ctrl+C to stop the system.
`);
    }, 5000);

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down production system...');
      backend.kill();
      frontend.kill();
      process.exit();
    });

  }, 3000);
}
