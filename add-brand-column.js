import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addBrandColumn() {
  const client = await pool.connect();
  try {
    console.log('📋 Checking products table structure...');

    // First, check the current structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log('Current products table columns:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if brand column exists
    const brandExists = structureResult.rows.some(col => col.column_name === 'brand');
    
    if (!brandExists) {
      console.log('\n📋 Adding brand column to products table...');
      
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN brand VARCHAR(255);
      `);
      
      console.log('✅ Added brand column to products table');
    } else {
      console.log('\n✅ Brand column already exists in products table');
    }

    // Check for other potentially missing columns that might be in the API
    const expectedColumns = [
      'brand', 'product_type', 'description', 'specifications', 
      'is_active', 'created_at', 'updated_at'
    ];

    const missingColumns = expectedColumns.filter(col => 
      !structureResult.rows.some(dbCol => dbCol.column_name === col)
    );

    if (missingColumns.length > 0) {
      console.log('\n📋 Adding other missing columns...');
      
      for (const column of missingColumns) {
        let columnDef;
        switch (column) {
          case 'product_type':
            columnDef = 'VARCHAR(255)';
            break;
          case 'description':
            columnDef = 'TEXT';
            break;
          case 'specifications':
            columnDef = 'TEXT';
            break;
          case 'is_active':
            columnDef = 'BOOLEAN DEFAULT true';
            break;
          case 'created_at':
            columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
            break;
          case 'updated_at':
            columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
            break;
          default:
            columnDef = 'VARCHAR(255)';
        }

        await client.query(`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS ${column} ${columnDef};
        `);
        
        console.log(`✅ Added ${column} column`);
      }
    }

    // Show final structure
    console.log('\n📊 Final products table structure:');
    const finalResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    finalResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎉 Products table updated successfully!');

  } catch (error) {
    console.error('❌ Error updating products table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addBrandColumn();