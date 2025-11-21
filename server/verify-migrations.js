import dbAdapter from './database/adapter.js';

async function verifyMigrations() {
  try {
    // Set correct database credentials
    process.env.DB_USER = process.env.DB_USER || 'erp_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'DevPassword123!';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_NAME = process.env.DB_NAME || 'erp_merchandiser';
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    
    await dbAdapter.initialize();
    console.log('✅ Database connected');
    
    // Verify Job Planning step exists
    const jobPlanningCheck = await dbAdapter.query(`
      SELECT 
        ps.name as sequence_name,
        pst."stepNumber",
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."isActive"
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps.name = 'Offset' OR ps.name LIKE 'Offset%'
      ORDER BY pst."stepNumber"
    `);
    
    console.log('\n📋 Process Sequence Steps for Offset:');
    console.log('='.repeat(60));
    jobPlanningCheck.rows.forEach(row => {
      const compulsory = row.is_compulsory ? '✅ Compulsory' : '⚪ Optional';
      console.log(`Step ${row.stepNumber}: ${row.step_name} - ${compulsory}`);
    });
    
    // Check if Job Planning exists
    const hasJobPlanning = jobPlanningCheck.rows.some(r => r.step_name === 'Job Planning');
    if (hasJobPlanning) {
      console.log('\n✅ Job Planning step found in sequence!');
    } else {
      console.log('\n❌ Job Planning step NOT found!');
    }
    
    // Check compulsory steps
    const compulsorySteps = jobPlanningCheck.rows.filter(r => r.is_compulsory && r.stepNumber <= 3);
    console.log(`\n✅ Compulsory Prepress Steps: ${compulsorySteps.length}/3`);
    compulsorySteps.forEach(step => {
      console.log(`   - Step ${step.stepNumber}: ${step.step_name}`);
    });
    
    if (compulsorySteps.length === 3) {
      console.log('\n✅ All prepress steps (Design, QA Review, CTP) are marked as compulsory!');
    }
    
    console.log('\n✅ Migration verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    process.exit(1);
  }
}

verifyMigrations();

