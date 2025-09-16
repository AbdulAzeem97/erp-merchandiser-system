import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addExcessStep() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding Excess step to Offset Enhanced process sequence...');

    // Find the Offset Enhanced process sequence
    const sequenceResult = await client.query(`
      SELECT id FROM process_sequences 
      WHERE product_type = 'Offset Enhanced' 
      AND sequence_name = 'Complete Offset Printing Process'
    `);

    if (sequenceResult.rows.length === 0) {
      console.log('❌ Offset Enhanced sequence not found');
      return;
    }

    const sequenceId = sequenceResult.rows[0].id;
    console.log(`✅ Found sequence: ${sequenceId}`);

    // Check if Excess step already exists
    const existingStep = await client.query(`
      SELECT id FROM process_steps 
      WHERE process_sequence_id = $1 AND name = 'Excess'
    `, [sequenceId]);

    if (existingStep.rows.length > 0) {
      console.log('✅ Excess step already exists');
      return;
    }

    // Get the maximum step order for this sequence
    const maxOrderResult = await client.query(`
      SELECT MAX(step_order) as max_order FROM process_steps 
      WHERE process_sequence_id = $1
    `, [sequenceId]);

    const nextOrder = (maxOrderResult.rows[0].max_order || 0) + 1;

    // Add the Excess step
    const stepId = uuidv4();
    await client.query(`
      INSERT INTO process_steps (
        id, process_sequence_id, name, department, step_order, 
        is_compulsory, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      stepId,
      sequenceId,
      'Excess',
      'Production',
      nextOrder,
      false, // Optional step
      true
    ]);

    console.log(`✅ Added Excess step with order ${nextOrder}`);

    // Also update the JSON steps in the process_sequences table
    const currentStepsResult = await client.query(`
      SELECT steps FROM process_sequences WHERE id = $1
    `, [sequenceId]);

    if (currentStepsResult.rows.length > 0) {
      const currentSteps = JSON.parse(currentStepsResult.rows[0].steps);
      currentSteps.push({
        name: 'Excess',
        department: 'Production',
        order: nextOrder,
        compulsory: false
      });

      await client.query(`
        UPDATE process_sequences 
        SET steps = $1 
        WHERE id = $2
      `, [JSON.stringify(currentSteps), sequenceId]);

      console.log('✅ Updated JSON steps in process_sequences table');
    }

    // Verify the addition
    const stepCount = await client.query(`
      SELECT COUNT(*) FROM process_steps 
      WHERE process_sequence_id = $1 AND is_active = true
    `, [sequenceId]);
    
    console.log(`📊 Total active steps for Offset Enhanced: ${stepCount.rows[0].count}`);
    console.log('🎉 Excess step added successfully to Offset Enhanced process!');

  } catch (error) {
    console.error('❌ Error adding Excess step:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addExcessStep();