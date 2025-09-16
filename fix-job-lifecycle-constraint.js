import dbAdapter from './server/database/adapter.js';

async function fixJobLifecycleConstraint() {
  try {
    console.log('🔧 Fixing job_lifecycle foreign key constraint...');
    
    // Drop the existing constraint
    await dbAdapter.query('ALTER TABLE job_lifecycle DROP CONSTRAINT IF EXISTS job_lifecycle_job_card_id_fkey');
    console.log('✅ Dropped existing constraint');
    
    // Add the correct constraint
    await dbAdapter.query('ALTER TABLE job_lifecycle ADD CONSTRAINT job_lifecycle_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES job_cards(id)');
    console.log('✅ Added correct foreign key constraint');
    
    console.log('🎉 Foreign key constraint fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing constraint:', err.message);
    process.exit(1);
  }
}

fixJobLifecycleConstraint();
