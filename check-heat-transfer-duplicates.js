import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkHeatTransferDuplicates() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Heat Transfer Label process steps...');

    // Get all Heat Transfer Label process steps
    const allStepsQuery = `
      SELECT
        ps.id,
        ps.name,
        ps.step_order,
        ps.process_sequence_id,
        seq.id as sequence_id,
        seq.product_type,
        ps.created_at
      FROM process_steps ps
      JOIN process_sequences seq ON ps.process_sequence_id = seq.id
      WHERE seq.product_type = 'Heat Transfer Label' AND ps.is_active = true
      ORDER BY ps.step_order, ps.name, ps.created_at;
    `;

    const result = await client.query(allStepsQuery);
    console.log(`Total steps found: ${result.rows.length}`);

    console.log('\n📊 All Heat Transfer Label steps:');
    result.rows.forEach(step => {
      console.log(`  ${step.step_order}. ${step.name} (ID: ${step.id}, SeqID: ${step.process_sequence_id})`);
    });

    // Check for duplicate sequences
    const sequenceQuery = `
      SELECT
        id,
        product_type,
        description,
        created_at
      FROM process_sequences
      WHERE product_type = 'Heat Transfer Label'
      ORDER BY created_at;
    `;

    const sequences = await client.query(sequenceQuery);
    console.log(`\n📋 Process sequences found: ${sequences.rows.length}`);

    sequences.rows.forEach(seq => {
      console.log(`  Sequence ID: ${seq.id} - ${seq.description} (Created: ${seq.created_at})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkHeatTransferDuplicates().catch(console.error);