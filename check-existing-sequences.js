import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'erp_merchandiser',
  user: 'erp_user',
  password: 'DevPassword123!'
});

async function checkExistingSequences() {
  try {
    console.log('🔍 Checking existing process sequences...');
    
    await client.connect();
    console.log('✅ Database connected successfully');

    // Check what sequences exist
    const sequences = await client.query('SELECT id, name, description FROM process_sequences ORDER BY name');
    console.log('📋 Existing process sequences:');
    sequences.rows.forEach((seq, index) => {
      console.log(`  ${index + 1}. ID: ${seq.id}, Name: "${seq.name}", Description: "${seq.description}"`);
    });

    // Check steps for each sequence
    for (const seq of sequences.rows) {
      const steps = await client.query(`
        SELECT id, "stepNumber", name, "isQualityCheck" 
        FROM process_steps 
        WHERE "sequenceId" = $1 
        ORDER BY "stepNumber"
      `, [seq.id]);
      
      console.log(`\n📝 Steps for "${seq.name}" (${steps.rows.length} steps):`);
      steps.rows.forEach((step, index) => {
        console.log(`    ${index + 1}. ${step.name} (Step ${step.stepNumber}, Quality: ${step.isQualityCheck})`);
      });
    }

    // Test different query variations
    console.log('\n🧪 Testing query variations...');
    
    // Test 1: Search by name = 'Offset'
    const test1 = await client.query(`
      SELECT ps.name, COUNT(pst.id) as step_count
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps.name = 'Offset'
      GROUP BY ps.name
    `);
    console.log('Test 1 (name = "Offset"):', test1.rows);

    // Test 2: Search by name LIKE '%Offset%'
    const test2 = await client.query(`
      SELECT ps.name, COUNT(pst.id) as step_count
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps.name LIKE '%Offset%'
      GROUP BY ps.name
    `);
    console.log('Test 2 (name LIKE "%Offset%"):', test2.rows);

    // Test 3: Search by name = 'offset' (lowercase)
    const test3 = await client.query(`
      SELECT ps.name, COUNT(pst.id) as step_count
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE LOWER(ps.name) = 'offset'
      GROUP BY ps.name
    `);
    console.log('Test 3 (LOWER(name) = "offset"):', test3.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkExistingSequences();

