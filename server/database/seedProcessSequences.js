import pool from './config.js';

const processSequencesData = [
  {
    productType: 'Offset',
    description: 'Offset printing process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Paper Cutting', isCompulsory: true, order: 4 },
      { name: 'Offset Printing', isCompulsory: true, order: 5 },
      { name: 'Digital Printing', isCompulsory: false, order: 6 },
      { name: 'Varnish Matt', isCompulsory: false, order: 7 },
      { name: 'Varnish Gloss', isCompulsory: false, order: 8 },
      { name: 'Varnish Soft Touch', isCompulsory: false, order: 9 },
      { name: 'Inlay Pasting', isCompulsory: false, order: 10 },
      { name: 'Lamination Matte', isCompulsory: false, order: 11 },
      { name: 'Lamination Gloss', isCompulsory: false, order: 12 },
      { name: 'Lamination Soft Touch', isCompulsory: false, order: 13 },
      { name: 'UV', isCompulsory: false, order: 14 },
      { name: 'Foil Matte', isCompulsory: false, order: 15 },
      { name: 'Foil Gloss', isCompulsory: false, order: 16 },
      { name: 'Screen Printing', isCompulsory: false, order: 17 },
      { name: 'Embossing', isCompulsory: false, order: 18 },
      { name: 'Debossing', isCompulsory: false, order: 19 },
      { name: 'Pasting', isCompulsory: false, order: 20 },
      { name: 'Two-way tape', isCompulsory: false, order: 21 },
      { name: 'Die Cutting', isCompulsory: false, order: 22 },
      { name: 'Breaking', isCompulsory: false, order: 23 },
      { name: 'Piggy Sticker', isCompulsory: false, order: 24 },
      { name: 'RFID', isCompulsory: false, order: 25 },
      { name: 'Eyelet', isCompulsory: false, order: 26 },
      { name: 'Out Source', isCompulsory: false, order: 27 },
      { name: 'Packing', isCompulsory: true, order: 28 },
      { name: 'Ready', isCompulsory: true, order: 29 },
      { name: 'Dispatch', isCompulsory: true, order: 30 },
      { name: 'Excess', isCompulsory: true, order: 31 }
    ]
  },
  {
    productType: 'Heat Transfer Label',
    description: 'Heat transfer label process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Exposing', isCompulsory: true, order: 4 },
      { name: 'Printing', isCompulsory: true, order: 5 },
      { name: 'Die Cutting', isCompulsory: true, order: 6 },
      { name: 'Breaking', isCompulsory: true, order: 7 },
      { name: 'Packing', isCompulsory: true, order: 8 },
      { name: 'Ready', isCompulsory: true, order: 9 },
      { name: 'Dispatch', isCompulsory: true, order: 10 },
      { name: 'Excess', isCompulsory: true, order: 11 }
    ]
  },
  {
    productType: 'PFL',
    description: 'PFL process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Block Making', isCompulsory: true, order: 4 },
      { name: 'Printing', isCompulsory: true, order: 5 },
      { name: 'RFID', isCompulsory: false, order: 6 },
      { name: 'Cut & Fold', isCompulsory: true, order: 7 },
      { name: 'Curring', isCompulsory: true, order: 8 },
      { name: 'Packing', isCompulsory: true, order: 9 },
      { name: 'Ready', isCompulsory: true, order: 10 },
      { name: 'Dispatch', isCompulsory: true, order: 11 },
      { name: 'Excess', isCompulsory: true, order: 12 }
    ]
  },
  {
    productType: 'Woven',
    description: 'Woven process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Dying', isCompulsory: true, order: 4 },
      { name: 'Weaving', isCompulsory: true, order: 5 },
      { name: 'Screen Printing', isCompulsory: true, order: 6 },
      { name: 'Slitting', isCompulsory: true, order: 7 },
      { name: 'RFID', isCompulsory: false, order: 8 },
      { name: 'Cut & Fold', isCompulsory: true, order: 9 },
      { name: 'Packing', isCompulsory: true, order: 10 },
      { name: 'Ready', isCompulsory: true, order: 11 },
      { name: 'Dispatch', isCompulsory: true, order: 12 },
      { name: 'Excess', isCompulsory: true, order: 13 }
    ]
  },
  {
    productType: 'Thermal',
    description: 'Thermal printing process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Thermal Printing', isCompulsory: true, order: 4 },
      { name: 'Die Cutting', isCompulsory: true, order: 5 },
      { name: 'Breaking', isCompulsory: true, order: 6 },
      { name: 'Packing', isCompulsory: true, order: 7 },
      { name: 'Ready', isCompulsory: true, order: 8 },
      { name: 'Dispatch', isCompulsory: true, order: 9 },
      { name: 'Excess', isCompulsory: true, order: 10 }
    ]
  },
  {
    productType: 'Leather Patch',
    description: 'Leather patch process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Leather Cutting', isCompulsory: true, order: 4 },
      { name: 'Embossing', isCompulsory: true, order: 5 },
      { name: 'Printing', isCompulsory: false, order: 6 },
      { name: 'Stitching', isCompulsory: true, order: 7 },
      { name: 'Packing', isCompulsory: true, order: 8 },
      { name: 'Ready', isCompulsory: true, order: 9 },
      { name: 'Dispatch', isCompulsory: true, order: 10 },
      { name: 'Excess', isCompulsory: true, order: 11 }
    ]
  },
  {
    productType: 'Digital',
    description: 'Digital printing process sequence',
    steps: [
      { name: 'Prepress', isCompulsory: true, order: 1 },
      { name: 'Material Procurement', isCompulsory: true, order: 2 },
      { name: 'Material Issuance', isCompulsory: true, order: 3 },
      { name: 'Digital Printing', isCompulsory: true, order: 4 },
      { name: 'Lamination', isCompulsory: false, order: 5 },
      { name: 'Die Cutting', isCompulsory: true, order: 6 },
      { name: 'Breaking', isCompulsory: true, order: 7 },
      { name: 'Packing', isCompulsory: true, order: 8 },
      { name: 'Ready', isCompulsory: true, order: 9 },
      { name: 'Dispatch', isCompulsory: true, order: 10 },
      { name: 'Excess', isCompulsory: true, order: 11 }
    ]
  }
];

async function seedProcessSequences() {
  try {
    console.log('🌱 Seeding process sequences...');
    
    for (const sequence of processSequencesData) {
      // Insert process sequence
      const sequenceResult = await pool.query(
        'INSERT INTO process_sequences (product_type, description) VALUES ($1, $2) RETURNING id',
        [sequence.productType, sequence.description]
      );
      
      const sequenceId = sequenceResult.rows[0].id;
      console.log(`✅ Created process sequence: ${sequence.productType}`);
      
      // Insert process steps
      for (const step of sequence.steps) {
        await pool.query(
          'INSERT INTO process_steps (process_sequence_id, name, is_compulsory, step_order) VALUES ($1, $2, $3, $4)',
          [sequenceId, step.name, step.isCompulsory, step.order]
        );
      }
      
      console.log(`✅ Created ${sequence.steps.length} steps for ${sequence.productType}`);
    }
    
    console.log('🎉 Process sequences seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding process sequences:', error);
  } finally {
    await pool.end();
  }
}

seedProcessSequences();
