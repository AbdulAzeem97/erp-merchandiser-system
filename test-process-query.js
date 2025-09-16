import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function testProcessQuery() {
  const client = await pool.connect();
  const productId = '6dd0d6b9-4b7f-42ba-b6d5-46b2645c4b3e';

  try {
    // First get product type
    const productResult = await client.query(
      'SELECT product_type FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );

    if (productResult.rows.length === 0) {
      console.log('Product not found');
      return;
    }

    const productType = productResult.rows[0].product_type;
    console.log('Product type:', productType);

    // Test simpler query without boolean comparisons
    const simpleQuery = `
      SELECT
        ps.id as sequence_id,
        ps.product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory,
        pst.step_order,
        pps.is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst.process_sequence_id
      LEFT JOIN product_process_selections pps ON pst.id = pps.step_id AND pps.product_id = $1
      WHERE ps.product_type = $2 AND ps.is_active = true AND pst.is_active = true
      ORDER BY pst.step_order ASC
    `;

    console.log('Running simple query...');
    const simpleResult = await client.query(simpleQuery, [productId, productType]);

    console.log(`Found ${simpleResult.rows.length} rows`);
    simpleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.step_name} (compulsory: ${row.is_compulsory}, selected: ${row.is_selected})`);
    });

    // Now test with filter
    const filteredQuery = `
      SELECT
        ps.id as sequence_id,
        ps.product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory,
        pst.step_order,
        pps.is_selected
      FROM process_sequences ps
      JOIN process_steps pst ON ps.id = pst.process_sequence_id
      LEFT JOIN product_process_selections pps ON pst.id = pps.step_id AND pps.product_id = $1
      WHERE ps.product_type = $2 AND ps.is_active = true AND pst.is_active = true
      AND (pst.is_compulsory = true OR (pps.is_selected IS NOT NULL AND pps.is_selected = true))
      ORDER BY pst.step_order ASC
    `;

    console.log('\nRunning filtered query...');
    const filteredResult = await client.query(filteredQuery, [productId, productType]);

    console.log(`Found ${filteredResult.rows.length} filtered rows`);
    filteredResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.step_name} (compulsory: ${row.is_compulsory}, selected: ${row.is_selected})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

testProcessQuery().catch(console.error);