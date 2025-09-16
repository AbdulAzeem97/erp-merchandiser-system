import dbAdapter from './server/database/adapter.js';

async function testDatabaseAdapter() {
  try {
    console.log('🧪 Testing database adapter...');
    
    // Test 1: Simple query
    console.log('\n1. Testing simple query...');
    const result1 = await dbAdapter.query('SELECT id, name FROM process_sequences WHERE name LIKE \'Offset%\' LIMIT 1');
    console.log('Result 1:', result1.rows);

    // Test 2: Join query
    console.log('\n2. Testing join query...');
    const result2 = await dbAdapter.query(`
      SELECT
        ps.id as sequence_id,
        ps.name as product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."stepNumber" as step_order
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps.name LIKE 'Offset%' AND ps."isActive" = true
      ORDER BY pst."stepNumber" ASC
      LIMIT 5
    `);
    console.log('Result 2:', result2.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testDatabaseAdapter();

