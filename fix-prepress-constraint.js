import dbAdapter from './server/database/adapter.js';

async function fixPrepressConstraint() {
  try {
    console.log('🔧 Fixing prepress_jobs foreign key constraint...');
    
    // Check current constraint
    const constraints = await dbAdapter.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'prepress_jobs'::regclass AND conname LIKE '%job_card_id%'
    `);
    
    console.log('Current prepress_jobs constraints:', constraints.rows);
    
    // Drop the existing constraint
    await dbAdapter.query('ALTER TABLE prepress_jobs DROP CONSTRAINT IF EXISTS prepress_jobs_job_card_id_fkey');
    console.log('✅ Dropped existing constraint');
    
    // Add the correct constraint
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD CONSTRAINT prepress_jobs_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES job_cards(id)');
    console.log('✅ Added correct foreign key constraint');
    
    console.log('🎉 Foreign key constraint fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing constraint:', err.message);
    process.exit(1);
  }
}

fixPrepressConstraint();
