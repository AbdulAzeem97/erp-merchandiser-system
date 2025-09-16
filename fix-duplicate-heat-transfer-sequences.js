import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function fixDuplicateHeatTransferSequences() {
  const client = await pool.connect();

  try {
    console.log('🔍 Fixing duplicate Heat Transfer Label sequences...');

    // Keep the older sequence (first created), delete the newer one
    const sequenceToDelete = '77abf18b-2658-446e-b31e-a199844c51c6'; // newer one
    const sequenceToKeep = 'eca4430b-9410-4bf6-a6a5-f29628c3dce5'; // older one

    console.log(`🗑️ Deleting newer sequence: ${sequenceToDelete}`);
    console.log(`✅ Keeping older sequence: ${sequenceToKeep}`);

    // First, delete all process steps associated with the newer sequence
    const deleteStepsResult = await client.query(
      'DELETE FROM process_steps WHERE process_sequence_id = $1',
      [sequenceToDelete]
    );
    console.log(`🗑️ Deleted ${deleteStepsResult.rowCount} process steps from newer sequence`);

    // Then delete the sequence itself
    const deleteSequenceResult = await client.query(
      'DELETE FROM process_sequences WHERE id = $1',
      [sequenceToDelete]
    );
    console.log(`🗑️ Deleted ${deleteSequenceResult.rowCount} process sequence`);

    // Verify cleanup
    const remainingSequences = await client.query(`
      SELECT id, product_type, description, created_at
      FROM process_sequences
      WHERE product_type = 'Heat Transfer Label'
      ORDER BY created_at;
    `);

    console.log(`\n📊 Remaining Heat Transfer Label sequences: ${remainingSequences.rows.length}`);
    remainingSequences.rows.forEach(seq => {
      console.log(`  - ${seq.id}: ${seq.description} (${seq.created_at})`);
    });

    const remainingSteps = await client.query(`
      SELECT COUNT(*) as count
      FROM process_steps ps
      JOIN process_sequences seq ON ps.process_sequence_id = seq.id
      WHERE seq.product_type = 'Heat Transfer Label' AND ps.is_active = true;
    `);

    console.log(`\n📋 Remaining Heat Transfer Label steps: ${remainingSteps.rows[0].count}`);

    console.log('\n✅ Heat Transfer Label duplicates cleaned up successfully!');

  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicateHeatTransferSequences().catch(console.error);