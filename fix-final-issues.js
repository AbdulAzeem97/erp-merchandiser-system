import dbAdapter from './server/database/adapter.js';

async function fixFinalIssues() {
  try {
    console.log('🔧 Fixing final issues...');
    
    // Add metadata column to prepress_activities
    await dbAdapter.query('ALTER TABLE prepress_activities ADD COLUMN IF NOT EXISTS metadata JSONB');
    console.log('✅ Added metadata column to prepress_activities');
    
    // Check what statuses are allowed in prepress_jobs
    const statusConstraint = await dbAdapter.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'prepress_jobs_status_check'
    `);
    
    console.log('prepress_jobs status constraint:', statusConstraint.rows[0]);
    
    // Drop the existing constraint and add a more permissive one
    await dbAdapter.query('ALTER TABLE prepress_jobs DROP CONSTRAINT IF EXISTS prepress_jobs_status_check');
    console.log('✅ Dropped existing status constraint');
    
    // Add a more permissive constraint
    await dbAdapter.query(`
      ALTER TABLE prepress_jobs ADD CONSTRAINT prepress_jobs_status_check 
      CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'HOD_REVIEW', 'CANCELLED'))
    `);
    console.log('✅ Added permissive status constraint');
    
    console.log('🎉 Final issues fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing issues:', err.message);
    process.exit(1);
  }
}

fixFinalIssues();
