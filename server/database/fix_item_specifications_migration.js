import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function fixMigration() {
  try {
    console.log('🔄 Fixing item_specifications migration...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    
    // Drop existing tables if they exist
    console.log('🗑️  Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS item_specification_items CASCADE;');
    await pool.query('DROP TABLE IF EXISTS item_specifications CASCADE;');
    console.log('✅ Tables dropped');
    
    // Create item_specifications table
    console.log('📝 Creating item_specifications table...');
    await pool.query(`
      CREATE TABLE item_specifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
        excel_file_link TEXT,
        excel_file_name VARCHAR(255),
        po_number VARCHAR(100),
        job_number VARCHAR(100),
        brand_name VARCHAR(255),
        item_name VARCHAR(255),
        uploaded_at TIMESTAMP WITH TIME ZONE,
        item_count INTEGER DEFAULT 0,
        total_quantity INTEGER DEFAULT 0,
        size_variants INTEGER DEFAULT 0,
        color_variants INTEGER DEFAULT 0,
        specifications JSONB DEFAULT '{}',
        raw_excel_data JSONB DEFAULT '{}',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ item_specifications table created');
    
    // Create item_specification_items table
    console.log('📝 Creating item_specification_items table...');
    await pool.query(`
      CREATE TABLE item_specification_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        item_specification_id UUID REFERENCES item_specifications(id) ON DELETE CASCADE,
        item_code VARCHAR(100) NOT NULL,
        color VARCHAR(100),
        size VARCHAR(50),
        quantity INTEGER NOT NULL DEFAULT 0,
        secondary_code VARCHAR(100),
        decimal_value DECIMAL(10, 4) DEFAULT 0,
        material VARCHAR(255),
        specifications JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ item_specification_items table created');
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_item_specifications_job_card_id ON item_specifications(job_card_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_item_specification_items_spec_id ON item_specification_items(item_specification_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_item_specification_items_item_code ON item_specification_items(item_code);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_item_specification_items_color ON item_specification_items(color);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_item_specification_items_size ON item_specification_items(size);');
    console.log('✅ Indexes created');
    
    // Verify tables were created
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('item_specifications', 'item_specification_items')
    `);
    
    console.log(`✅ Verified tables exist: ${checkTables.rows.map(r => r.table_name).join(', ')}`);
    
    await pool.end();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

fixMigration();

