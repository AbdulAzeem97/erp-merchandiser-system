import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'erp_merchandiser',
  user: 'erp_user',
  password: 'DevPassword123!'
});

async function testSimpleQuery() {
  try {
    console.log('🧪 Testing simple database query...');
    
    await client.connect();
    console.log('✅ Database connected successfully');

    // Test 1: Simple query without joins
    console.log('\n1. Testing simple process_sequences query...');
    const result1 = await client.query('SELECT id, name, description FROM process_sequences WHERE name LIKE \'Offset%\' LIMIT 1');
    console.log('Result 1:', result1.rows);

    // Test 2: Simple process_steps query
    console.log('\n2. Testing simple process_steps query...');
    const result2 = await client.query('SELECT id, "sequenceId", name, "stepNumber" FROM process_steps WHERE "sequenceId" = 6 LIMIT 3');
    console.log('Result 2:', result2.rows);

    // Test 3: Join query
    console.log('\n3. Testing join query...');
    const result3 = await client.query(`
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
    console.log('Result 3:', result3.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

testSimpleQuery();

