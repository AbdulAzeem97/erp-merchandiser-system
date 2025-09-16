import dbAdapter from './server/database/adapter.js';

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns...');
    
    // Add status column to job_lifecycle_history
    await dbAdapter.query('ALTER TABLE job_lifecycle_history ADD COLUMN IF NOT EXISTS status TEXT');
    console.log('✅ Added status column to job_lifecycle_history');
    
    // Add due_date column to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS due_date TIMESTAMP');
    console.log('✅ Added due_date column to prepress_jobs');
    
    // Add message column to job_lifecycle_history
    await dbAdapter.query('ALTER TABLE job_lifecycle_history ADD COLUMN IF NOT EXISTS message TEXT');
    console.log('✅ Added message column to job_lifecycle_history');
    
    // Add design_status column to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS design_status TEXT');
    console.log('✅ Added design_status column to prepress_jobs');
    
    // Add die_plate_status column to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS die_plate_status TEXT');
    console.log('✅ Added die_plate_status column to prepress_jobs');
    
    // Add other_status column to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS other_status TEXT');
    console.log('✅ Added other_status column to prepress_jobs');
    
    // Add created_by column to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS created_by TEXT');
    console.log('✅ Added created_by column to prepress_jobs');
    
    // Add notes columns to prepress_jobs
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS design_notes TEXT');
    console.log('✅ Added design_notes column to prepress_jobs');
    
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS die_plate_notes TEXT');
    console.log('✅ Added die_plate_notes column to prepress_jobs');
    
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS other_notes TEXT');
    console.log('✅ Added other_notes column to prepress_jobs');
    
    // Create prepress_activities table
    await dbAdapter.query(`
      CREATE TABLE IF NOT EXISTS prepress_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prepress_job_id UUID NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prepress_job_id) REFERENCES prepress_jobs(id)
      )
    `);
    console.log('✅ Created prepress_activities table');
    
    console.log('🎉 Missing columns added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding columns:', err.message);
    process.exit(1);
  }
}

addMissingColumns();