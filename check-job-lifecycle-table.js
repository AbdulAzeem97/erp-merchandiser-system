import dbAdapter from './server/database/adapter.js';

async function checkJobLifecycleTable() {
  try {
    const result = await dbAdapter.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'job_lifecycle'
    `);
    
    console.log('job_lifecycle table exists:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      // Check the structure
      const structure = await dbAdapter.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'job_lifecycle' 
        ORDER BY ordinal_position
      `);
      
      console.log('job_lifecycle structure:');
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
      
      // Check foreign key constraints
      const constraints = await dbAdapter.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'job_lifecycle'::regclass
      `);
      
      console.log('job_lifecycle constraints:');
      constraints.rows.forEach(row => {
        console.log(`  ${row.conname}: ${row.definition}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkJobLifecycleTable();
