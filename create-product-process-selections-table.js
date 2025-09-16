import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function createProductProcessSelectionsTable() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking if product_process_selections table exists...');

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_process_selections'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('ℹ️ Table product_process_selections already exists');
      return;
    }

    console.log('🏗️ Creating product_process_selections table...');

    // Create the table
    await client.query(`
      CREATE TABLE product_process_selections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        step_id VARCHAR NOT NULL REFERENCES process_steps(id) ON DELETE CASCADE,
        is_selected BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Ensure unique combination of product and step
        UNIQUE(product_id, step_id)
      );
    `);

    console.log('✅ Created product_process_selections table');

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_process_selections_product_id
      ON product_process_selections(product_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_process_selections_step_id
      ON product_process_selections(step_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_process_selections_selected
      ON product_process_selections(is_selected);
    `);

    console.log('✅ Created indexes for product_process_selections');

    // Create trigger for updated_at
    await client.query(`
      CREATE TRIGGER update_product_process_selections_updated_at
      BEFORE UPDATE ON product_process_selections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Created updated_at trigger');

    // Verify table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_process_selections'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎉 product_process_selections table created successfully!');

  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createProductProcessSelectionsTable().catch(console.error);