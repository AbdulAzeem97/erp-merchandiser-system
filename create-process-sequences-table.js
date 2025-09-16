import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function createProcessSequencesTable() {
  const client = await pool.connect();
  try {
    console.log('📋 Creating process_sequences table...');

    // Create the process_sequences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS process_sequences (
        id VARCHAR(255) PRIMARY KEY,
        product_type VARCHAR(255) NOT NULL,
        sequence_name VARCHAR(255) NOT NULL,
        steps TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Created process_sequences table');

    // Create some sample process sequences
    const sampleSequences = [
      {
        id: uuidv4(),
        product_type: 'Offset',
        sequence_name: 'Standard Offset Printing',
        steps: JSON.stringify([
          { step: 1, name: 'Prepress Design', department: 'Prepress', estimated_hours: 2 },
          { step: 2, name: 'Plate Making', department: 'Prepress', estimated_hours: 1 },
          { step: 3, name: 'Material Preparation', department: 'Inventory', estimated_hours: 0.5 },
          { step: 4, name: 'Offset Printing', department: 'Production', estimated_hours: 4 },
          { step: 5, name: 'Quality Check', department: 'QA', estimated_hours: 0.5 },
          { step: 6, name: 'Finishing', department: 'Production', estimated_hours: 1 },
          { step: 7, name: 'Packaging', department: 'Dispatch', estimated_hours: 0.5 }
        ]),
        created_by: 'system'
      },
      {
        id: uuidv4(),
        product_type: 'Digital',
        sequence_name: 'Digital Printing Process',
        steps: JSON.stringify([
          { step: 1, name: 'File Preparation', department: 'Prepress', estimated_hours: 1 },
          { step: 2, name: 'Material Check', department: 'Inventory', estimated_hours: 0.25 },
          { step: 3, name: 'Digital Printing', department: 'Production', estimated_hours: 2 },
          { step: 4, name: 'Quality Inspection', department: 'QA', estimated_hours: 0.25 },
          { step: 5, name: 'Cutting & Finishing', department: 'Production', estimated_hours: 0.5 },
          { step: 6, name: 'Packaging', department: 'Dispatch', estimated_hours: 0.25 }
        ]),
        created_by: 'system'
      },
      {
        id: uuidv4(),
        product_type: 'Large Format',
        sequence_name: 'Large Format Printing',
        steps: JSON.stringify([
          { step: 1, name: 'Design Setup', department: 'Prepress', estimated_hours: 1.5 },
          { step: 2, name: 'Material Setup', department: 'Inventory', estimated_hours: 0.5 },
          { step: 3, name: 'Large Format Printing', department: 'Production', estimated_hours: 3 },
          { step: 4, name: 'Lamination', department: 'Production', estimated_hours: 1 },
          { step: 5, name: 'Quality Check', department: 'QA', estimated_hours: 0.5 },
          { step: 6, name: 'Cutting & Mounting', department: 'Production', estimated_hours: 2 },
          { step: 7, name: 'Final Packaging', department: 'Dispatch', estimated_hours: 0.5 }
        ]),
        created_by: 'system'
      }
    ];

    // Insert sample sequences
    for (const sequence of sampleSequences) {
      const insertQuery = `
        INSERT INTO process_sequences (id, product_type, sequence_name, steps, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `;

      await client.query(insertQuery, [
        sequence.id,
        sequence.product_type,
        sequence.sequence_name,
        sequence.steps,
        true,
        sequence.created_by
      ]);

      console.log(`✅ Added process sequence: ${sequence.sequence_name} for ${sequence.product_type}`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) FROM process_sequences WHERE is_active = true');
    console.log(`\n📊 Total active process sequences: ${countResult.rows[0].count}`);

    console.log('\n🎉 Process sequences table created and populated successfully!');

  } catch (error) {
    console.error('❌ Error creating process sequences table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createProcessSequencesTable();