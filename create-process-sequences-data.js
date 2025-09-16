import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'erp_merchandiser',
  user: 'erp_user',
  password: 'DevPassword123!'
});

async function createProcessSequencesData() {
  try {
    console.log('🔧 Creating process sequences data for Prisma schema...');
    
    await client.connect();
    console.log('✅ Database connected successfully');

    // Check if we already have process sequences
    const existingSequences = await client.query('SELECT COUNT(*) as count FROM process_sequences');
    console.log('📋 Existing process sequences:', existingSequences.rows[0].count);

    if (parseInt(existingSequences.rows[0].count) === 0) {
      console.log('➕ Creating process sequences...');
      
      // Create process sequences for different product types
      const sequences = [
        {
          name: 'Offset',
          description: 'Complete offset printing process workflow',
          steps: [
            { name: 'Design Creation', description: 'Create artwork and design files', stepNumber: 1, isQualityCheck: true },
            { name: 'Prepress Preparation', description: 'Prepare files for printing', stepNumber: 2, isQualityCheck: true },
            { name: 'Plate Making', description: 'Create printing plates', stepNumber: 3, isQualityCheck: true },
            { name: 'Color Matching', description: 'Match colors to specifications', stepNumber: 4, isQualityCheck: true },
            { name: 'Printing Setup', description: 'Setup printing press', stepNumber: 5, isQualityCheck: true },
            { name: 'Printing', description: 'Execute the printing process', stepNumber: 6, isQualityCheck: true },
            { name: 'Quality Check', description: 'Inspect print quality', stepNumber: 7, isQualityCheck: true },
            { name: 'Finishing', description: 'Cut, fold, and finish products', stepNumber: 8, isQualityCheck: true },
            { name: 'Packaging', description: 'Package finished products', stepNumber: 9, isQualityCheck: true }
          ]
        },
        {
          name: 'Heat Transfer Label',
          description: 'Heat transfer label production workflow',
          steps: [
            { name: 'Design Creation', description: 'Create artwork for heat transfer', stepNumber: 1, isQualityCheck: true },
            { name: 'Material Preparation', description: 'Prepare heat transfer materials', stepNumber: 2, isQualityCheck: true },
            { name: 'Printing', description: 'Print on heat transfer paper', stepNumber: 3, isQualityCheck: true },
            { name: 'Cutting', description: 'Cut labels to size', stepNumber: 4, isQualityCheck: true },
            { name: 'Quality Check', description: 'Inspect label quality', stepNumber: 5, isQualityCheck: true },
            { name: 'Packaging', description: 'Package finished labels', stepNumber: 6, isQualityCheck: true }
          ]
        },
        {
          name: 'PFL',
          description: 'PFL (Print, Fold, Label) production workflow',
          steps: [
            { name: 'Design Creation', description: 'Create PFL artwork', stepNumber: 1, isQualityCheck: true },
            { name: 'Printing', description: 'Print on PFL material', stepNumber: 2, isQualityCheck: true },
            { name: 'Folding', description: 'Fold according to specifications', stepNumber: 3, isQualityCheck: true },
            { name: 'Labeling', description: 'Apply labels', stepNumber: 4, isQualityCheck: true },
            { name: 'Quality Check', description: 'Inspect PFL quality', stepNumber: 5, isQualityCheck: true },
            { name: 'Packaging', description: 'Package finished PFL', stepNumber: 6, isQualityCheck: true }
          ]
        },
        {
          name: 'Woven',
          description: 'Woven label production workflow',
          steps: [
            { name: 'Design Creation', description: 'Create woven label design', stepNumber: 1, isQualityCheck: true },
            { name: 'Weaving Setup', description: 'Setup weaving machine', stepNumber: 2, isQualityCheck: true },
            { name: 'Weaving', description: 'Weave the label', stepNumber: 3, isQualityCheck: true },
            { name: 'Cutting', description: 'Cut woven labels', stepNumber: 4, isQualityCheck: true },
            { name: 'Quality Check', description: 'Inspect woven quality', stepNumber: 5, isQualityCheck: true },
            { name: 'Packaging', description: 'Package woven labels', stepNumber: 6, isQualityCheck: true }
          ]
        },
        {
          name: 'Thermal',
          description: 'Thermal label production workflow',
          steps: [
            { name: 'Design Creation', description: 'Create thermal label design', stepNumber: 1, isQualityCheck: true },
            { name: 'Thermal Printing', description: 'Print using thermal printer', stepNumber: 2, isQualityCheck: true },
            { name: 'Cutting', description: 'Cut thermal labels', stepNumber: 3, isQualityCheck: true },
            { name: 'Quality Check', description: 'Inspect thermal print quality', stepNumber: 4, isQualityCheck: true },
            { name: 'Packaging', description: 'Package thermal labels', stepNumber: 5, isQualityCheck: true }
          ]
        },
        {
          name: 'Digital',
          description: 'Digital printing workflow',
          steps: [
            { name: 'Design Creation', description: 'Create digital artwork', stepNumber: 1, isQualityCheck: true },
            { name: 'Digital Printing', description: 'Print using digital printer', stepNumber: 2, isQualityCheck: true },
            { name: 'Finishing', description: 'Apply finishing treatments', stepNumber: 3, isQualityCheck: false },
            { name: 'Quality Check', description: 'Inspect digital print quality', stepNumber: 4, isQualityCheck: true },
            { name: 'Packaging', description: 'Package digital prints', stepNumber: 5, isQualityCheck: true }
          ]
        }
      ];

      for (const sequence of sequences) {
        // Insert process sequence
        const sequenceResult = await client.query(`
          INSERT INTO process_sequences (name, description, "isActive")
          VALUES ($1, $2, $3)
          RETURNING id
        `, [sequence.name, sequence.description, true]);
        
        const sequenceId = sequenceResult.rows[0].id;
        console.log(`✅ Created sequence: ${sequence.name} (ID: ${sequenceId})`);

        // Insert process steps
        for (const step of sequence.steps) {
          await client.query(`
            INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [sequenceId, step.stepNumber, step.name, step.description, step.isQualityCheck, true]);
        }
        
        console.log(`✅ Created ${sequence.steps.length} steps for ${sequence.name}`);
      }
    } else {
      console.log('✅ Process sequences already exist');
    }

    // Test the API query
    console.log('🧪 Testing API query for Offset...');
    const testQuery = `
      SELECT
        ps.id as sequence_id,
        ps.name as product_type,
        ps.description,
        pst.id as step_id,
        pst.name as step_name,
        pst."isQualityCheck" as is_compulsory,
        pst."stepNumber" as step_order
      FROM process_sequences ps
      LEFT JOIN process_steps pst ON ps.id = pst."sequenceId"
      WHERE ps.name = $1 AND ps."isActive" = true
      ORDER BY pst."stepNumber" ASC
    `;

    const result = await client.query(testQuery, ['Offset']);
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

    console.log('🎉 Process sequences data creation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

createProcessSequencesData();

