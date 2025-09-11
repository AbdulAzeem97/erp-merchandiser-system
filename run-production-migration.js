import fs from 'fs';
import path from 'path';
import pool from './server/database/sqlite-config.js';
import { seedProductionData } from './server/database/production-seed.js';

async function runProductionMigration() {
  console.log('🚀 Starting Production Module Migration...');
  
  try {
    // Read and execute the production schema
    console.log('📋 Reading production schema...');
    const schemaPath = path.resolve('./server/database/production-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL statements and execute them
    console.log('🗄️ Creating production tables...');
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      try {
        pool.db.exec(statement);
      } catch (error) {
        // Ignore "table already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Error executing statement:', statement);
          throw error;
        }
      }
    }
    
    console.log('✅ Production tables created successfully!');
    
    // Seed the production data
    console.log('🌱 Seeding production data...');
    await seedProductionData();
    
    console.log('🎉 Production module migration completed successfully!');
    console.log('');
    console.log('📋 Production Module Structure Created:');
    console.log('  • 6 Production Departments');
    console.log('  • 50+ Production Processes');
    console.log('  • Role-based Access Control (Director, HOD, Supervisor, Operator, Quality Inspector)');
    console.log('  • Equipment Management');
    console.log('  • Material Consumption Tracking');
    console.log('  • Quality Control System');
    console.log('  • Production Workflow Templates');
    console.log('  • Real-time Job Tracking');
    console.log('  • Analytics and Reporting');
    console.log('');
    console.log('🔐 Default Production Roles:');
    console.log('  • DIRECTOR: Full system access');
    console.log('  • HOD: Department-level access');
    console.log('  • SUPERVISOR: Team-level management');
    console.log('  • OPERATOR: Job execution access');
    console.log('  • QUALITY_INSPECTOR: Quality control access');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runProductionMigration();