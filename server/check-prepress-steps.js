import dbAdapter from './database/adapter.js';

async function checkPrepressSteps() {
  try {
    process.env.DB_USER = process.env.DB_USER || 'erp_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'DevPassword123!';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_NAME = process.env.DB_NAME || 'erp_merchandiser';
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    
    await dbAdapter.initialize();
    
    // Check all process sequences and their steps
    const allSequences = await dbAdapter.query(`
      SELECT 
        ps.id,
        ps.name as sequence_name,
        pst."stepNumber",
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."isActive"
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps."isActive" = true AND pst."isActive" = true
      ORDER BY ps.name, pst."stepNumber"
    `);
    
    console.log('\n📋 All Process Sequences and Steps:');
    console.log('='.repeat(80));
    
    let currentSequence = '';
    allSequences.rows.forEach(row => {
      if (row.sequence_name !== currentSequence) {
        currentSequence = row.sequence_name;
        console.log(`\n🔹 ${currentSequence}:`);
      }
      const compulsory = row.is_compulsory ? '✅' : '⚪';
      console.log(`   ${compulsory} Step ${row.stepNumber}: ${row.step_name}`);
    });
    
    // Check for Design, QA, CTP steps specifically
    const prepressSteps = allSequences.rows.filter(r => 
      r.step_name.toLowerCase().includes('design') ||
      r.step_name.toLowerCase().includes('qa') ||
      r.step_name.toLowerCase().includes('ctp') ||
      r.step_name.toLowerCase().includes('prepress')
    );
    
    if (prepressSteps.length > 0) {
      console.log('\n\n🔍 Prepress-related steps found:');
      prepressSteps.forEach(step => {
        console.log(`   - ${step.sequence_name}: Step ${step.stepNumber} - ${step.step_name} (${step.is_compulsory ? 'Compulsory' : 'Optional'})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPrepressSteps();

