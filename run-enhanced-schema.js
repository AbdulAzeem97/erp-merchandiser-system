import dbAdapter from './server/database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEnhancedSchema() {
  try {
    console.log('🚀 Starting enhanced job lifecycle schema setup...');
    
    // Read the enhanced schema file
    const schemaPath = path.join(__dirname, 'server/database/enhanced-job-lifecycle-schema-simple.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await dbAdapter.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if tables/columns already exist, which is OK
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate column') ||
              error.message.includes('relation already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Enhanced job lifecycle schema setup completed successfully!');
    
    // Test the schema by querying some tables
    console.log('🔍 Testing schema...');
    
    try {
      const testQuery = 'SELECT COUNT(*) as count FROM job_lifecycle';
      const result = await dbAdapter.query(testQuery);
      console.log(`✅ job_lifecycle table accessible: ${result.rows[0].count} records`);
    } catch (error) {
      console.log('⚠️  job_lifecycle table test failed:', error.message);
    }
    
    try {
      const testQuery = 'SELECT COUNT(*) as count FROM prepress_jobs';
      const result = await dbAdapter.query(testQuery);
      console.log(`✅ prepress_jobs table accessible: ${result.rows[0].count} records`);
    } catch (error) {
      console.log('⚠️  prepress_jobs table test failed:', error.message);
    }
    
    try {
      const testQuery = 'SELECT COUNT(*) as count FROM inventory_jobs';
      const result = await dbAdapter.query(testQuery);
      console.log(`✅ inventory_jobs table accessible: ${result.rows[0].count} records`);
    } catch (error) {
      console.log('⚠️  inventory_jobs table test failed:', error.message);
    }
    
    console.log('🎯 Enhanced job lifecycle system is ready!');
    
  } catch (error) {
    console.error('❌ Error setting up enhanced schema:', error);
    process.exit(1);
  }
}

// Run the schema setup
runEnhancedSchema().then(() => {
  console.log('✅ Schema setup completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Schema setup failed:', error);
  process.exit(1);
});