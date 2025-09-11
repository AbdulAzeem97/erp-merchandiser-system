import { v4 as uuidv4 } from 'uuid';
import dbAdapter from './adapter.js';

async function seedProcessSequences() {
  try {
    console.log('Starting process sequences seeding...');

    // Define process sequences for different product types
    const processSequencesData = [
      {
        product_type: 'Offset',
        description: 'Standard offset printing process',
        steps: [
          { name: 'Design Review', is_compulsory: true, order: 1 },
          { name: 'Pre-Press Setup', is_compulsory: true, order: 2 },
          { name: 'Plate Making', is_compulsory: true, order: 3 },
          { name: 'Paper Cutting', is_compulsory: true, order: 4 },
          { name: 'Ink Preparation', is_compulsory: true, order: 5 },
          { name: 'Machine Setup', is_compulsory: true, order: 6 },
          { name: 'Color Matching', is_compulsory: true, order: 7 },
          { name: 'Test Print', is_compulsory: true, order: 8 },
          { name: 'Quality Check', is_compulsory: true, order: 9 },
          { name: 'Main Printing', is_compulsory: true, order: 10 },
          { name: 'Drying', is_compulsory: true, order: 11 },
          { name: 'Lamination', is_compulsory: false, order: 12 },
          { name: 'UV Coating', is_compulsory: false, order: 13 },
          { name: 'Varnishing', is_compulsory: false, order: 14 },
          { name: 'Embossing', is_compulsory: false, order: 15 },
          { name: 'Foil Stamping', is_compulsory: false, order: 16 },
          { name: 'Die Cutting', is_compulsory: true, order: 17 },
          { name: 'Creasing', is_compulsory: false, order: 18 },
          { name: 'Folding', is_compulsory: false, order: 19 },
          { name: 'Trimming', is_compulsory: true, order: 20 },
          { name: 'Perforation', is_compulsory: false, order: 21 },
          { name: 'Scoring', is_compulsory: false, order: 22 },
          { name: 'Gluing', is_compulsory: false, order: 23 },
          { name: 'Binding', is_compulsory: false, order: 24 },
          { name: 'Corner Rounding', is_compulsory: false, order: 25 },
          { name: 'Hole Punching', is_compulsory: false, order: 26 },
          { name: 'String Attachment', is_compulsory: false, order: 27 },
          { name: 'Quality Inspection', is_compulsory: true, order: 28 },
          { name: 'Packaging', is_compulsory: true, order: 29 },
          { name: 'Final Count', is_compulsory: true, order: 30 },
          { name: 'Shipping Prep', is_compulsory: true, order: 31 }
        ]
      },
      {
        product_type: 'Digital',
        description: 'Digital printing process',
        steps: [
          { name: 'File Preparation', is_compulsory: true, order: 1 },
          { name: 'Color Calibration', is_compulsory: true, order: 2 },
          { name: 'Material Loading', is_compulsory: true, order: 3 },
          { name: 'Test Print', is_compulsory: true, order: 4 },
          { name: 'Quality Check', is_compulsory: true, order: 5 },
          { name: 'Main Printing', is_compulsory: true, order: 6 },
          { name: 'Lamination', is_compulsory: false, order: 7 },
          { name: 'Die Cutting', is_compulsory: true, order: 8 },
          { name: 'Finishing', is_compulsory: true, order: 9 },
          { name: 'Quality Inspection', is_compulsory: true, order: 10 },
          { name: 'Packaging', is_compulsory: true, order: 11 }
        ]
      },
      {
        product_type: 'Screen',
        description: 'Screen printing process',
        steps: [
          { name: 'Screen Preparation', is_compulsory: true, order: 1 },
          { name: 'Stencil Creation', is_compulsory: true, order: 2 },
          { name: 'Ink Mixing', is_compulsory: true, order: 3 },
          { name: 'Setup Registration', is_compulsory: true, order: 4 },
          { name: 'Test Print', is_compulsory: true, order: 5 },
          { name: 'Production Run', is_compulsory: true, order: 6 },
          { name: 'Curing/Drying', is_compulsory: true, order: 7 },
          { name: 'Quality Check', is_compulsory: true, order: 8 },
          { name: 'Finishing', is_compulsory: true, order: 9 },
          { name: 'Packaging', is_compulsory: true, order: 10 }
        ]
      },
      {
        product_type: 'Flexo',
        description: 'Flexographic printing process',
        steps: [
          { name: 'Plate Mounting', is_compulsory: true, order: 1 },
          { name: 'Anilox Setup', is_compulsory: true, order: 2 },
          { name: 'Ink Preparation', is_compulsory: true, order: 3 },
          { name: 'Registration', is_compulsory: true, order: 4 },
          { name: 'Test Run', is_compulsory: true, order: 5 },
          { name: 'Production', is_compulsory: true, order: 6 },
          { name: 'Drying', is_compulsory: true, order: 7 },
          { name: 'Slitting', is_compulsory: false, order: 8 },
          { name: 'Rewinding', is_compulsory: true, order: 9 },
          { name: 'Quality Control', is_compulsory: true, order: 10 },
          { name: 'Packaging', is_compulsory: true, order: 11 }
        ]
      },
      {
        product_type: 'Woven',
        description: 'Woven label production process',
        steps: [
          { name: 'Design Setup', is_compulsory: true, order: 1 },
          { name: 'Yarn Preparation', is_compulsory: true, order: 2 },
          { name: 'Loom Setup', is_compulsory: true, order: 3 },
          { name: 'Sample Weaving', is_compulsory: true, order: 4 },
          { name: 'Production Weaving', is_compulsory: true, order: 5 },
          { name: 'Heat Cutting', is_compulsory: true, order: 6 },
          { name: 'Ultrasonic Cutting', is_compulsory: false, order: 7 },
          { name: 'Folding', is_compulsory: false, order: 8 },
          { name: 'Center Folding', is_compulsory: false, order: 9 },
          { name: 'End Folding', is_compulsory: false, order: 10 },
          { name: 'Sewing', is_compulsory: false, order: 11 },
          { name: 'Quality Check', is_compulsory: true, order: 12 },
          { name: 'Packaging', is_compulsory: true, order: 13 }
        ]
      }
    ];

    // Insert process sequences and their steps
    for (const sequenceData of processSequencesData) {
      console.log(`Seeding process sequence for: ${sequenceData.product_type}`);
      
      const sequenceId = uuidv4();
      
      // Insert process sequence
      await pool.query(`
        INSERT INTO process_sequences (id, product_type, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_type) DO UPDATE SET
        description = $2
      `, [sequenceId, sequenceData.product_type, sequenceData.description]);

      // Get the actual sequence ID (in case it was updated due to conflict)
      const actualSequenceResult = await pool.query(
        'SELECT id FROM process_sequences WHERE product_type = $1',
        [sequenceData.product_type]
      );
      const actualSequenceId = actualSequenceResult.rows[0].id;

      // Delete existing steps for this sequence to avoid duplicates
      await pool.query(
        'DELETE FROM process_steps WHERE process_sequence_id = $1',
        [actualSequenceId]
      );

      // Insert process steps
      for (const step of sequenceData.steps) {
        const stepId = uuidv4();
        await pool.query(`
          INSERT INTO process_steps (id, process_sequence_id, name, is_compulsory, step_order)
          VALUES ($1, $2, $3, $4, $5)
        `, [stepId, actualSequenceId, step.name, step.is_compulsory ? 1 : 0, step.order]);
      }

      console.log(`✅ Seeded ${sequenceData.steps.length} steps for ${sequenceData.product_type}`);
    }

    console.log('✅ Process sequences seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Process sequences seeding failed:', error);
    process.exit(1);
  }
}

seedProcessSequences();