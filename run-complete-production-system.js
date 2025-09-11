#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏭 Starting Complete Production System Setup...\n');

// Step 1: Run database migrations
console.log('📊 Setting up complete production database...');
try {
  // Run the complete production schema
  execSync('node -e "const pool = require(\\"./server/database/sqlite-config.js\\").default; const schema = require(\\"fs\\").readFileSync(\\"./server/database/complete-production-schema.sql\\", \\"utf8\\"); schema.split(\\";\\").filter(s => s.trim()).forEach(stmt => { try { pool.prepare(stmt + \\";\\").run(); } catch(e) { if(!e.message.includes(\\"already exists\\")) console.log(\\"Warning:\\", e.message); } }); console.log(\\"✅ Complete production schema loaded\\");"', 
    { stdio: 'inherit', cwd: __dirname });

  // Run the complete production seed data
  execSync('node -e "const pool = require(\\"./server/database/sqlite-config.js\\").default; const seedData = require(\\"fs\\").readFileSync(\\"./server/database/complete-production-seed.sql\\", \\"utf8\\"); seedData.split(\\";\\").filter(s => s.trim()).forEach(stmt => { try { pool.prepare(stmt + \\";\\").run(); } catch(e) { if(!e.message.includes(\\"UNIQUE constraint failed\\")) console.log(\\"Warning:\\", e.message); } }); console.log(\\"✅ Complete production seed data loaded\\");"', 
    { stdio: 'inherit', cwd: __dirname });

  console.log('✅ Database setup completed successfully!\n');
} catch (error) {
  console.log('⚠️ Database setup encountered some warnings, continuing...\n');
}

// Step 2: Update server routes
console.log('🛠️ Configuring server routes...');
try {
  const serverIndexPath = path.join(__dirname, 'server/index.js');
  let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
  
  // Add complete production routes if not already present
  if (!serverContent.includes('complete-production')) {
    const routeImport = "import completeProductionRoutes from './routes/complete-production.js';\n";
    const routeUse = "app.use('/api/complete-production', completeProductionRoutes);\n";
    
    // Add import after other route imports
    if (serverContent.includes("import productionRoutes from './routes/production.js';")) {
      serverContent = serverContent.replace(
        "import productionRoutes from './routes/production.js';",
        "import productionRoutes from './routes/production.js';\n" + routeImport
      );
    } else {
      serverContent = serverContent.replace(
        "import { createServer } from 'http';",
        "import { createServer } from 'http';\n" + routeImport
      );
    }
    
    // Add route use after other route uses
    if (serverContent.includes("app.use('/api/production', productionRoutes);")) {
      serverContent = serverContent.replace(
        "app.use('/api/production', productionRoutes);",
        "app.use('/api/production', productionRoutes);\n" + routeUse
      );
    } else {
      serverContent = serverContent.replace(
        "app.use('/api', router);",
        "app.use('/api', router);\n" + routeUse
      );
    }
    
    fs.writeFileSync(serverIndexPath, serverContent);
    console.log('✅ Server routes configured successfully!\n');
  } else {
    console.log('✅ Server routes already configured!\n');
  }
} catch (error) {
  console.log('⚠️ Server route configuration skipped - manual setup may be needed\n');
}

// Step 3: Create main production app component
console.log('⚛️ Setting up React production app...');
const productionAppContent = `import React, { useState, useEffect } from 'react';
import ProductionLogin from './components/production/ProductionLogin';
import ProductionDashboard from './components/production/ProductionDashboard';
import { Toaster } from '@/components/ui/sonner';

interface ProductionUserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  production_roles: Array<{
    id: string;
    department_id: string;
    department_name: string;
    department_code: string;
    role_type: string;
    permissions: string[];
    can_approve_jobs: boolean;
    can_assign_jobs: boolean;
    max_priority_level: number;
  }>;
  has_director_access: boolean;
}

const ProductionApp: React.FC = () => {
  const [user, setUser] = useState<ProductionUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing login
    const savedUser = localStorage.getItem('production_user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('production_user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: ProductionUserData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('production_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <>
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Production Management System
                  </h1>
                  <p className="text-sm text-gray-600">
                    Welcome, {user.first_name} {user.last_name} - {user.production_roles[0]?.role_type}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductionDashboard
              userAccess={{
                hasDirectorAccess: user.has_director_access,
                permissions: user.production_roles.flatMap(role => role.permissions),
                departmentAccess: user.production_roles.map(role => ({
                  departmentId: role.department_id,
                  departmentName: role.department_name,
                  departmentCode: role.department_code,
                  roleType: role.role_type,
                  permissions: role.permissions,
                  canApproveJobs: role.can_approve_jobs,
                  canAssignJobs: role.can_assign_jobs,
                  maxPriorityLevel: role.max_priority_level
                }))
              }}
            />
          </div>
        </>
      ) : (
        <ProductionLogin onLogin={handleLogin} />
      )}
      <Toaster />
    </div>
  );
};

export default ProductionApp;`;

fs.writeFileSync(path.join(__dirname, 'src/components/production/ProductionApp.tsx'), productionAppContent);
console.log('✅ Production app component created!\n');

// Step 4: Create production route in main app
console.log('🔗 Adding production route to main app...');
try {
  const appPath = path.join(__dirname, 'src/App.tsx');
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  if (!appContent.includes('ProductionApp')) {
    // Add import
    appContent = appContent.replace(
      "import { Toaster } from '@/components/ui/toaster';",
      "import { Toaster } from '@/components/ui/toaster';\nimport ProductionApp from '@/components/production/ProductionApp';"
    );
    
    // Add route
    appContent = appContent.replace(
      '<Route path="*" element={<NotFound />} />',
      '<Route path="/production/*" element={<ProductionApp />} />\n            <Route path="*" element={<NotFound />} />'
    );
    
    fs.writeFileSync(appPath, appContent);
    console.log('✅ Production route added to main app!\n');
  } else {
    console.log('✅ Production route already exists in main app!\n');
  }
} catch (error) {
  console.log('⚠️ Main app route addition skipped - manual setup may be needed\n');
}

// Step 5: Start the application
console.log('🚀 Starting the complete production system...\n');

// Start both backend and frontend
const { spawn } = require('child_process');

console.log('Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  cwd: __dirname,
  shell: true
});

backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('[BACKEND]', output);
});

backend.stderr.on('data', (data) => {
  const output = data.toString();
  if (!output.includes('ExperimentalWarning')) {
    console.log('[BACKEND ERROR]', output);
  }
});

setTimeout(() => {
  console.log('Starting frontend development server...');
  const frontend = spawn('npm', ['run', 'dev:frontend'], {
    stdio: 'pipe',
    cwd: __dirname,
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[FRONTEND]', output);
  });

  frontend.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('ExperimentalWarning')) {
      console.log('[FRONTEND ERROR]', output);
    }
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down production system...');
    backend.kill();
    frontend.kill();
    process.exit();
  });

  console.log(`
🎉 Complete Production System is starting up!

📱 Frontend: http://localhost:5173
🔧 Backend: http://localhost:3000
🏭 Production System: http://localhost:5173/production

Available Demo Users:
👑 Director: director / director123
👨‍💼 HOD Accounts: 
   - offset_hod / offset123
   - heat_hod / heat123  
   - pfl_hod / pfl123
   - woven_hod / woven123
   - leather_hod / leather123
   - digital_hod / digital123
👥 Supervisors: offset_sup / sup123, prepress_sup / prep123
🔧 Operators: offset_op / op123, digital_op / dop123
🔍 Quality Inspector: quality_qc / qc123

Features:
✅ Complete hierarchical production management
✅ Role-based access control
✅ 6 main production departments with sub-departments
✅ Comprehensive workflow management
✅ Real-time job tracking and status updates
✅ Quality control and material management
✅ Equipment monitoring and maintenance
✅ Detailed reporting and analytics

Press Ctrl+C to stop the system.
`);
}, 3000);

console.log('Complete production system setup completed! 🏭✨');`;

fs.writeFileSync(path.join(__dirname, 'run-complete-production-system.js'), content);

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze existing production system structure", "status": "completed", "activeForm": "Analyzing existing production system structure"}, {"content": "Design production hierarchy and department structure", "status": "completed", "activeForm": "Designing production hierarchy and department structure"}, {"content": "Create production authentication and role-based access control", "status": "completed", "activeForm": "Creating production authentication and role-based access control"}, {"content": "Build production database schema with department workflows", "status": "completed", "activeForm": "Building production database schema with department workflows"}, {"content": "Implement backend API routes for production departments", "status": "completed", "activeForm": "Implementing backend API routes for production departments"}, {"content": "Create production dashboard with hierarchical views", "status": "completed", "activeForm": "Creating production dashboard with hierarchical views"}, {"content": "Build department-specific workflow components", "status": "completed", "activeForm": "Building department-specific workflow components"}, {"content": "Test complete production module integration", "status": "in_progress", "activeForm": "Testing complete production module integration"}]