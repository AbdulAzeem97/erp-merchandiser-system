import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function fixDuplicateProcessSteps() {
  const client = await pool.connect();

  try {
    console.log('🔍 Finding and fixing duplicate process steps...');

    // Find duplicates by looking at steps with same name and step_order in same sequence
    const duplicatesQuery = `
      WITH duplicate_groups AS (
        SELECT
          ps.process_sequence_id,
          ps.name,
          ps.step_order,
          COUNT(*) as count,
          MIN(ps.created_at) as earliest_created,
          ARRAY_AGG(ps.id ORDER BY ps.created_at) as ids
        FROM process_steps ps
        WHERE ps.is_active = true
        GROUP BY ps.process_sequence_id, ps.name, ps.step_order
        HAVING COUNT(*) > 1
      )
      SELECT * FROM duplicate_groups;
    `;

    const duplicates = await client.query(duplicatesQuery);
    console.log(`Found ${duplicates.rows.length} groups of duplicates`);

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicates found');
      return;
    }

    console.log('\n🔄 Duplicate groups:');
    for (const group of duplicates.rows) {
      console.log(`- ${group.name} (Step ${group.step_order}): ${group.count} duplicates`);
      console.log(`  IDs: ${group.ids.join(', ')}`);

      // Keep the first one (earliest created), delete the rest
      const idsToDelete = group.ids.slice(1);

      for (const idToDelete of idsToDelete) {
        await client.query('DELETE FROM process_steps WHERE id = $1', [idToDelete]);
        console.log(`  🗑️ Deleted duplicate: ${idToDelete}`);
      }

      console.log(`  ✅ Kept: ${group.ids[0]} (earliest created)`);
    }

    // Verify the cleanup
    const remainingSteps = await client.query(`
      SELECT
        ps.process_sequence_id,
        ps.name,
        ps.step_order,
        COUNT(*) as count
      FROM process_steps ps
      JOIN process_sequences seq ON ps.process_sequence_id = seq.id
      WHERE ps.is_active = true AND seq.product_type = 'Heat Transfer Label'
      GROUP BY ps.process_sequence_id, ps.name, ps.step_order
      HAVING COUNT(*) > 1;
    `);

    if (remainingSteps.rows.length > 0) {
      console.log('\n❌ Still have duplicates after cleanup:');
      remainingSteps.rows.forEach(row => {
        console.log(`- ${row.name} (Step ${row.step_order}): ${row.count} instances`);
      });
    } else {
      console.log('\n✅ All duplicates cleaned up successfully!');
    }

    // Show final count
    const finalCount = await client.query(`
      SELECT COUNT(*) as total_steps
      FROM process_steps ps
      JOIN process_sequences seq ON ps.process_sequence_id = seq.id
      WHERE ps.is_active = true AND seq.product_type = 'Heat Transfer Label';
    `);

    console.log(`\n📊 Final count of Offset process steps: ${finalCount.rows[0].total_steps}`);

  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicateProcessSteps().catch(console.error);