import dbAdapter from './server/database/adapter.js';

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Starting database schema fix...');
    
    await dbAdapter.initialize();
    console.log('✅ Database connected');

    // Check if process_sequences table exists
    const sequencesTableCheck = await dbAdapter.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'process_sequences'
      );
    `);
    
    console.log('📋 Process sequences table exists:', sequencesTableCheck.rows[0].exists);

    if (!sequencesTableCheck.rows[0].exists) {
      console.log('➕ Creating process_sequences table...');
      await dbAdapter.query(`
        CREATE TABLE process_sequences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          product_type VARCHAR(255) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created process_sequences table');
    }

    // Check if process_steps table exists
    const stepsTableCheck = await dbAdapter.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'process_steps'
      );
    `);
    
    console.log('📋 Process steps table exists:', stepsTableCheck.rows[0].exists);

    if (!stepsTableCheck.rows[0].exists) {
      console.log('➕ Creating process_steps table...');
      await dbAdapter.query(`
        CREATE TABLE process_steps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          process_sequence_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          step_order INTEGER NOT NULL,
          is_compulsory BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (process_sequence_id) REFERENCES process_sequences(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Created process_steps table');
    } else {
      // Check if the process_sequence_id column exists
      const columnCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'process_steps'
          AND column_name = 'process_sequence_id'
        );
      `);
      
      console.log('📋 process_sequence_id column exists:', columnCheck.rows[0].exists);
      
      if (!columnCheck.rows[0].exists) {
        console.log('➕ Adding process_sequence_id column...');
        await dbAdapter.query(`
          ALTER TABLE process_steps 
          ADD COLUMN process_sequence_id UUID;
        `);
        
        // Add foreign key constraint
        await dbAdapter.query(`
          ALTER TABLE process_steps 
          ADD CONSTRAINT fk_process_steps_sequence 
          FOREIGN KEY (process_sequence_id) REFERENCES process_sequences(id) ON DELETE CASCADE;
        `);
        
        console.log('✅ Added process_sequence_id column and foreign key');
      }
    }

    // Check if Offset sequence exists
    const offsetCheck = await dbAdapter.query('SELECT id FROM process_sequences WHERE product_type = $1', ['Offset']);
    
    if (offsetCheck.rows.length === 0) {
      console.log('➕ Creating Offset process sequence...');
      
      // Create Offset process sequence
      const sequenceResult = await dbAdapter.query(`
        INSERT INTO process_sequences (name, product_type, description, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['Offset Printing', 'Offset', 'Complete offset printing process workflow', true]);
      
      const sequenceId = sequenceResult.rows[0].id;
      console.log('✅ Created sequence with ID:', sequenceId);

      // Create process steps for Offset
      const steps = [
        { name: 'Design Creation', description: 'Create artwork and design files', step_order: 1, is_compulsory: true },
        { name: 'Prepress Preparation', description: 'Prepare files for printing', step_order: 2, is_compulsory: true },
        { name: 'Plate Making', description: 'Create printing plates', step_order: 3, is_compulsory: true },
        { name: 'Color Matching', description: 'Match colors to specifications', step_order: 4, is_compulsory: true },
        { name: 'Printing Setup', description: 'Setup printing press', step_order: 5, is_compulsory: true },
        { name: 'Printing', description: 'Execute the printing process', step_order: 6, is_compulsory: true },
        { name: 'Quality Check', description: 'Inspect print quality', step_order: 7, is_compulsory: true },
        { name: 'Finishing', description: 'Cut, fold, and finish products', step_order: 8, is_compulsory: true },
        { name: 'Packaging', description: 'Package finished products', step_order: 9, is_compulsory: true }
      ];

      for (const step of steps) {
        await dbAdapter.query(`
          INSERT INTO process_steps (process_sequence_id, name, description, step_order, is_compulsory, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [sequenceId, step.name, step.description, step.step_order, step.is_compulsory, true]);
      }

      console.log('✅ Created', steps.length, 'process steps for Offset');
    } else {
      console.log('✅ Offset process sequence already exists');
    }

    // Test the API query
    console.log('🧪 Testing API query...');
    const testQuery = `
      SELECT
        ps.id as sequence_id,
        ps.product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst.is_compulsory,
        pst.step_order
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst.process_sequence_id
      WHERE ps.product_type = $1 AND ps.is_active = true
      ORDER BY pst.step_order ASC
    `;

    const result = await dbAdapter.query(testQuery, ['Offset']);
    console.log('🎯 Query result:');
    console.log('Found', result.rows.length, 'rows');
    
    if (result.rows.length > 0) {
      console.log('✅ API query works! First few rows:');
      result.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.step_name} (Order: ${row.step_order}, Compulsory: ${row.is_compulsory})`);
      });
    } else {
      console.log('❌ No data found for Offset product type');
    }

    console.log('🎉 Database schema fix completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixDatabaseSchema();

