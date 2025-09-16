import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addComprehensiveProcessSequences() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding comprehensive process sequences...');

    // Define all the new product types and their specific workflows
    const productSequences = [
      {
        product_type: 'Heat Transfer Label',
        sequence_name: 'Heat Transfer Label Production',
        steps: [
          { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
          { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
          { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
          { name: 'Exposing', department: 'Production', order: 4, compulsory: false },
          { name: 'Printing', department: 'Production', order: 5, compulsory: false },
          { name: 'Die Cutting', department: 'Production', order: 6, compulsory: false },
          { name: 'Breaking', department: 'Production', order: 7, compulsory: false },
          { name: 'Packing', department: 'Production', order: 8, compulsory: false },
          { name: 'Ready', department: 'QA', order: 9, compulsory: false },
          { name: 'Dispatch', department: 'Dispatch', order: 10, compulsory: false }
        ]
      },
      {
        product_type: 'PFL',
        sequence_name: 'PFL Production Process',
        steps: [
          { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
          { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
          { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
          { name: 'Block Making', department: 'Production', order: 4, compulsory: false },
          { name: 'Printing', department: 'Production', order: 5, compulsory: false },
          { name: 'RFID', department: 'Production', order: 6, compulsory: false },
          { name: 'Cut & Fold', department: 'Production', order: 7, compulsory: false },
          { name: 'Curing', department: 'Production', order: 8, compulsory: false },
          { name: 'Packing', department: 'Production', order: 9, compulsory: false },
          { name: 'Ready', department: 'QA', order: 10, compulsory: false },
          { name: 'Dispatch', department: 'Dispatch', order: 11, compulsory: false }
        ]
      },
      {
        product_type: 'Woven',
        sequence_name: 'Woven Label Production',
        steps: [
          { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
          { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
          { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
          { name: 'Dying', department: 'Production', order: 4, compulsory: false },
          { name: 'Weaving', department: 'Production', order: 5, compulsory: false },
          { name: 'Screen Printing', department: 'Production', order: 6, compulsory: false },
          { name: 'Sliting', department: 'Production', order: 7, compulsory: false },
          { name: 'RFID', department: 'Production', order: 8, compulsory: false },
          { name: 'Cut & Fold', department: 'Production', order: 9, compulsory: false },
          { name: 'Packing', department: 'Production', order: 10, compulsory: false },
          { name: 'Ready', department: 'QA', order: 11, compulsory: false },
          { name: 'Dispatch', department: 'Dispatch', order: 12, compulsory: false }
        ]
      },
      {
        product_type: 'Thermal',
        sequence_name: 'Thermal Label Production',
        steps: [
          { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
          { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
          { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
          { name: 'Printing', department: 'Production', order: 4, compulsory: false },
          { name: 'RFID', department: 'Production', order: 5, compulsory: false },
          { name: 'Ready', department: 'QA', order: 6, compulsory: false },
          { name: 'Dispatch', department: 'Dispatch', order: 7, compulsory: false }
        ]
      },
      {
        product_type: 'Leather Patch',
        sequence_name: 'Leather Patch Production',
        steps: [
          { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
          { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
          { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
          { name: 'Block Making', department: 'Production', order: 4, compulsory: false },
          { name: 'Offset Printing', department: 'Production', order: 5, compulsory: false },
          { name: 'RFID', department: 'Production', order: 6, compulsory: false },
          { name: 'Screen Printing', department: 'Production', order: 7, compulsory: false },
          { name: 'Embossing', department: 'Production', order: 8, compulsory: false },
          { name: 'Debossing', department: 'Production', order: 9, compulsory: false },
          { name: 'Die Cutting', department: 'Production', order: 10, compulsory: false },
          { name: 'Breaking', department: 'Production', order: 11, compulsory: false },
          { name: 'Crushing', department: 'Production', order: 12, compulsory: false },
          { name: 'Packing', department: 'Production', order: 13, compulsory: false },
          { name: 'Ready', department: 'QA', order: 14, compulsory: false },
          { name: 'Dispatch', department: 'Dispatch', order: 15, compulsory: false }
        ]
      }
    ];

    // Enhanced Offset sequence with all the steps you specified
    const enhancedOffset = {
      product_type: 'Offset Enhanced',
      sequence_name: 'Complete Offset Printing Process',
      steps: [
        { name: 'Prepress', department: 'Prepress', order: 1, compulsory: true },
        { name: 'Material Procurement', department: 'Inventory', order: 2, compulsory: true },
        { name: 'Material Issuance', department: 'Inventory', order: 3, compulsory: true },
        { name: 'Paper Cutting', department: 'Production', order: 4, compulsory: false },
        { name: 'Offset Printing', department: 'Production', order: 5, compulsory: false },
        { name: 'Digital Printing', department: 'Production', order: 6, compulsory: false },
        { name: 'Varnish Matt', department: 'Production', order: 7, compulsory: false },
        { name: 'Varnish Gloss', department: 'Production', order: 8, compulsory: false },
        { name: 'Varnish Soft Touch', department: 'Production', order: 9, compulsory: false },
        { name: 'Inlay Pasting', department: 'Production', order: 10, compulsory: false },
        { name: 'Lamination Matte', department: 'Production', order: 11, compulsory: false },
        { name: 'Lamination Gloss', department: 'Production', order: 12, compulsory: false },
        { name: 'Lamination Soft Touch', department: 'Production', order: 13, compulsory: false },
        { name: 'UV', department: 'Production', order: 14, compulsory: false },
        { name: 'Foil Matte', department: 'Production', order: 15, compulsory: false },
        { name: 'Foil Gloss', department: 'Production', order: 16, compulsory: false },
        { name: 'Screen Printing', department: 'Production', order: 17, compulsory: false },
        { name: 'Embossing', department: 'Production', order: 18, compulsory: false },
        { name: 'Debossing', department: 'Production', order: 19, compulsory: false },
        { name: 'Pasting', department: 'Production', order: 20, compulsory: false },
        { name: 'Two way tape', department: 'Production', order: 21, compulsory: false },
        { name: 'Die Cutting', department: 'Production', order: 22, compulsory: false },
        { name: 'Breaking', department: 'Production', order: 23, compulsory: false },
        { name: 'Piggy Sticker', department: 'Production', order: 24, compulsory: false },
        { name: 'RFID', department: 'Production', order: 25, compulsory: false },
        { name: 'Eyelet', department: 'Production', order: 26, compulsory: false },
        { name: 'Out Source', department: 'Production', order: 27, compulsory: false },
        { name: 'Packing', department: 'Production', order: 28, compulsory: false },
        { name: 'Ready', department: 'QA', order: 29, compulsory: false },
        { name: 'Dispatch', department: 'Dispatch', order: 30, compulsory: false }
      ]
    };

    // Add the enhanced offset to the list
    productSequences.push(enhancedOffset);

    // Insert all the new process sequences
    for (const sequence of productSequences) {
      const sequenceId = uuidv4();
      
      // Insert the process sequence
      await client.query(`
        INSERT INTO process_sequences (id, product_type, sequence_name, steps, description, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        sequenceId,
        sequence.product_type,
        sequence.sequence_name,
        JSON.stringify(sequence.steps),
        `Complete workflow for ${sequence.sequence_name}`,
        true,
        'system'
      ]);

      console.log(`✅ Added sequence: ${sequence.sequence_name}`);

      // Insert all the process steps
      for (const step of sequence.steps) {
        const stepId = uuidv4();
        
        await client.query(`
          INSERT INTO process_steps (
            id, process_sequence_id, name, department, step_order, 
            is_compulsory, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          stepId,
          sequenceId,
          step.name,
          step.department,
          step.order,
          step.compulsory,
          true
        ]);
      }

      console.log(`  ✅ Added ${sequence.steps.length} steps for ${sequence.product_type}`);
    }

    // Verify insertion
    const sequenceCount = await client.query('SELECT COUNT(*) FROM process_sequences WHERE is_active = true');
    const stepCount = await client.query('SELECT COUNT(*) FROM process_steps WHERE is_active = true');
    
    console.log(`\n📊 Total active sequences: ${sequenceCount.rows[0].count}`);
    console.log(`📊 Total active steps: ${stepCount.rows[0].count}`);

    console.log('\n🎉 Comprehensive process sequences added successfully!');

  } catch (error) {
    console.error('❌ Error adding comprehensive process sequences:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addComprehensiveProcessSequences();