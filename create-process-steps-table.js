import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function createProcessStepsTable() {
  const client = await pool.connect();
  try {
    console.log('📋 Creating process_steps table...');

    // Create the process_steps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS process_steps (
        id VARCHAR(255) PRIMARY KEY,
        process_sequence_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        estimated_hours DECIMAL(4,2),
        step_order INTEGER NOT NULL,
        is_compulsory BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_sequence_id) REFERENCES process_sequences(id)
      );
    `);

    console.log('✅ Created process_steps table');

    // Get existing process sequences to expand their JSON steps
    const sequences = await client.query('SELECT id, product_type, steps FROM process_sequences');
    
    for (const sequence of sequences.rows) {
      const steps = JSON.parse(sequence.steps);
      
      console.log(`📋 Adding steps for ${sequence.product_type}...`);
      
      for (const step of steps) {
        const stepId = uuidv4();
        
        await client.query(`
          INSERT INTO process_steps (
            id, process_sequence_id, name, department, 
            estimated_hours, step_order, is_compulsory, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [
          stepId,
          sequence.id,
          step.name,
          step.department,
          step.estimated_hours,
          step.step,
          true, // All steps are compulsory by default
          true
        ]);
        
        console.log(`  ✅ Added step: ${step.name} (${step.department})`);
      }
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) FROM process_steps WHERE is_active = true');
    console.log(`\n📊 Total active process steps: ${countResult.rows[0].count}`);

    console.log('\n🎉 Process steps table created and populated successfully!');

  } catch (error) {
    console.error('❌ Error creating process steps table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createProcessStepsTable();