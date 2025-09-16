import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkProcessSteps() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking process steps for duplicates...');

    // Check process_steps table
    const stepsResult = await client.query(`
      SELECT ps.id, ps.name, ps.product_type, ps.is_compulsory, ps.step_order, ps.is_active,
             COUNT(*) OVER (PARTITION BY ps.name, ps.product_type) as duplicate_count
      FROM process_steps ps
      WHERE ps.is_active = true
      ORDER BY ps.product_type, ps.step_order, ps.name;
    `);

    console.log(`\n📊 Found ${stepsResult.rows.length} process steps:`);

    const duplicates = stepsResult.rows.filter(row => row.duplicate_count > 1);

    if (duplicates.length > 0) {
      console.log('\n❌ Duplicate process steps found:');
      const duplicateGroups = {};
      duplicates.forEach(row => {
        const key = `${row.product_type}-${row.name}`;
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(row);
      });

      Object.keys(duplicateGroups).forEach(key => {
        console.log(`\n🔄 ${key}:`);
        duplicateGroups[key].forEach(row => {
          console.log(`  - ID: ${row.id}, Order: ${row.step_order}, Compulsory: ${row.is_compulsory}`);
        });
      });

      // Remove duplicates, keeping the one with the latest/highest step_order
      console.log('\n🧹 Removing duplicates...');
      for (const key of Object.keys(duplicateGroups)) {
        const group = duplicateGroups[key];
        group.sort((a, b) => (b.step_order || 0) - (a.step_order || 0));

        // Keep the first (highest order), delete the rest
        const toDelete = group.slice(1);
        for (const item of toDelete) {
          await client.query('DELETE FROM process_steps WHERE id = $1', [item.id]);
          console.log(`🗑️ Deleted duplicate: ${item.name} (${item.id})`);
        }
      }
    } else {
      console.log('\n✅ No duplicates found in process_steps table');
    }

    // Check by product type
    const byProductType = await client.query(`
      SELECT product_type, COUNT(*) as step_count
      FROM process_steps
      WHERE is_active = true
      GROUP BY product_type
      ORDER BY product_type;
    `);

    console.log('\n📈 Steps by product type:');
    byProductType.rows.forEach(row => {
      console.log(`  - ${row.product_type}: ${row.step_count} steps`);
    });

  } catch (error) {
    console.error('❌ Error checking process steps:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkProcessSteps().catch(console.error);